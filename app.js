// ============================================
// PROBLEM DATA CONFIGURATION
// ============================================
// Problems are organized by month in YYYY-MM format
// Loaded at runtime from ladder_problems.json, via the DOMContentLoaded event listener
let PROBLEMS_BY_MONTH = {};

// ============================================
// SHARE CONFIGURATION
// ============================================
const SHARE_BASE_URL = 'castle-ladder.short.gy';

// Encoding/Decoding functions for share codes
function encodeMonthProgressToShareCode(problems, month) {
    // Encode month (YYYY-MM format) as 5-char hex preamble
    // Example: "2026-02" -> "202602" (6 digits) -> decimal -> hex (max 5 chars)
    const monthDigits = month.replace('-', ''); // "2026-02" -> "202602"
    const monthDecimal = parseInt(monthDigits, 10);
    const monthHex = monthDecimal.toString(16).padStart(5, '0');

    // Map status to single digit (0-4)
    const statusToDigit = {
        null: '0',
        [COMPLETION_STATUS.NOT_COMPLETED]: '0',
        [COMPLETION_STATUS.FIRST_ATTEMPT]: '1',
        [COMPLETION_STATUS.SECOND_ATTEMPT]: '2',
        [COMPLETION_STATUS.THIRD_ATTEMPT]: '3',
        [COMPLETION_STATUS.FOURTH_PLUS]: '4'
    };

    // Sort problems by id before encoding to ensure consistent order
    const sortedProblems = problems.slice().sort((a, b) => a.id - b.id);

    // Convert all 21 problems to digits
    const digits = sortedProblems.map(p => statusToDigit[p.status] || '0').join('');

    // Break into chunks: 5-5-5-5-1
    const chunks = [
        digits.slice(0, 5),
        digits.slice(5, 10),
        digits.slice(10, 15),
        digits.slice(15, 20),
        digits.slice(20, 21)
    ];

    // Encode each chunk to hex (base-5 → decimal → hex)
    const encoded = chunks.map((chunk, i) => {
        const decimal = parseInt(chunk, 5);
        const hex = decimal.toString(16);
        // Pad first 4 chunks to 3 chars, last chunk to 1 char
        return hex.padStart(i < 4 ? 3 : 1, '0');
    });

    // Combine month preamble + problem data
    // Format: MMMMM + PPPPPPPPPPPPP (5 + 13 = 18 chars)
    return monthHex + encoded.join('');
}

function encodeProgressToShareCode() {
    const stored = localStorage.getItem('bouldering-progress');
    if (!stored) return '';

    const allProgress = JSON.parse(stored);

    // Only encode months that exist in PROBLEMS_BY_MONTH, in chronological order
    const knownMonths = Object.keys(PROBLEMS_BY_MONTH).sort();

    return knownMonths
        .filter(month => allProgress[month] && Object.keys(allProgress[month]).length > 0)
        .map(month => {
            // Reconstruct the problems array with statuses from localStorage
            const progressMap = allProgress[month];
            const problems = PROBLEMS_BY_MONTH[month].map(p => ({
                ...p,
                status: progressMap[p.ouyId] || null
            }));
            return encodeMonthProgressToShareCode(problems, month);
        })
        .join('');
}

function decodeMonthShareCodeToProgress(shareCode) {
    // Validate share code length (5 for month + 13 for problems = 18)
    if (shareCode.length !== 18) {
        console.error('Invalid share code length:', shareCode.length, 'expected 18');
        return null;
    }

    // Extract month preamble (first 5 chars)
    const monthHex = shareCode.slice(0, 5);
    const monthDecimal = parseInt(monthHex, 16);
    const monthDigits = monthDecimal.toString().padStart(6, '0');
    const year = monthDigits.slice(0, 4);
    const month = monthDigits.slice(4, 6);
    const decodedMonth = `${year}-${month}`;

    // Extract problem data (remaining 13 chars)
    const problemData = shareCode.slice(5);

    // Break into chunks: 3-3-3-3-1
    const chunks = [
        problemData.slice(0, 3),
        problemData.slice(3, 6),
        problemData.slice(6, 9),
        problemData.slice(9, 12),
        problemData.slice(12, 13)
    ];

    // Decode each chunk (hex → decimal → base-5)
    const decoded = chunks.map((hex, i) => {
        const decimal = parseInt(hex, 16);
        const base5 = decimal.toString(5);
        // Pad first 4 chunks to 5 digits, last chunk to 1 digit
        return base5.padStart(i < 4 ? 5 : 1, '0');
    }).join('');

    // Map digits back to status
    const digitToStatus = {
        '0': null,
        '1': COMPLETION_STATUS.FIRST_ATTEMPT,
        '2': COMPLETION_STATUS.SECOND_ATTEMPT,
        '3': COMPLETION_STATUS.THIRD_ATTEMPT,
        '4': COMPLETION_STATUS.FOURTH_PLUS
    };

    // Convert to array of statuses
    const statuses = decoded.split('').map(d => digitToStatus[d]);

    // Get problems for this month and sort by id
    const monthProblems = (PROBLEMS_BY_MONTH[decodedMonth] || []).sort((a, b) => a.id - b.id);

    if (!monthProblems) {
        console.error('No problem data found for month:', decodedMonth);
        return null;
    }

    // Build localStorage-compatible JSON format
    const progressMap = {};
    monthProblems.forEach((problem, index) => {
        const status = statuses[index];
        if (status && status !== COMPLETION_STATUS.NOT_COMPLETED) {
            progressMap[problem.ouyId] = status;
        }
    });

    // Build the full localStorage structure
    const localStorageData = {
        [decodedMonth]: progressMap
    };

    return {
        shareCode: shareCode,
        month: decodedMonth,
        decodedDigits: decoded,
        statuses: statuses,
        localStorageData: localStorageData
    };
}

function decodeShareCodeToProgress(shareCode) {
    // Share codes are 18 chars per month; reject anything that doesn't align
    if (!shareCode || shareCode.length === 0 || shareCode.length % 18 !== 0) {
        console.error('Invalid share code length:', shareCode.length, '(expected a multiple of 18)');
        return null;
    }

    // Decode each 18-char month chunk
    const monthChunks = [];
    for (let i = 0; i < shareCode.length; i += 18) {
        const decoded = decodeMonthShareCodeToProgress(shareCode.slice(i, i + 18));
        if (!decoded) return null;
        monthChunks.push(decoded);
    }

    // Merge all months into a single localStorageData object
    const localStorageData = {};
    monthChunks.forEach(chunk => {
        Object.assign(localStorageData, chunk.localStorageData);
    });

    // Return unified result; preserve single-month fields on first chunk for backward compatibility
    const first = monthChunks[0];
    return {
        shareCode: shareCode,
        month: first.month,
        months: monthChunks.map(c => c.month),
        decodedDigits: first.decodedDigits,
        statuses: first.statuses,
        localStorageData: localStorageData
    };
}


// Current month to display (automatically determined from current date)
const CURRENT_MONTH = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
})();

// ============================================
// COMPLETION STATUS & POINTS CONFIGURATION
// ============================================

const COMPLETION_STATUS = {
    NOT_COMPLETED: 'not-completed',
    FIRST_ATTEMPT: '1st-attempt',
    SECOND_ATTEMPT: '2nd-attempt',
    THIRD_ATTEMPT: '3rd-attempt',
    FOURTH_PLUS: '4th-plus'
};

const POINTS = {
    [COMPLETION_STATUS.NOT_COMPLETED]: 0,
    [COMPLETION_STATUS.FIRST_ATTEMPT]: 10,
    [COMPLETION_STATUS.SECOND_ATTEMPT]: 7,
    [COMPLETION_STATUS.THIRD_ATTEMPT]: 4,
    [COMPLETION_STATUS.FOURTH_PLUS]: 1
};

// ============================================
// STATE MANAGEMENT
// ============================================

class BoulderingTracker {
    constructor(currentMonth) {
        this.month = currentMonth;
        this.problems = [];
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.attachEventListeners();
        this.renderProblems();
        this.updateLadderGrid();
        this.updateStats();
        this.populateAreaFilter();
    }

    dispose() {
        document.getElementById('areaFilter').removeEventListener('change', this._onAreaChange);
        document.getElementById('statusFilter').removeEventListener('change', this._onStatusChange);
        document.querySelectorAll('.ladder-box').forEach(box => {
            box.removeEventListener('click', this._onLadderClick);
        });
    }

    loadFromLocalStorage() {
        const savedProgress = localStorage.getItem('bouldering-progress');

        // Get problems for current month and sort by id
        const problemsData = (PROBLEMS_BY_MONTH[this.month] || []).sort((a, b) => a.id - b.id);

        if (savedProgress) {
            const allProgressData = JSON.parse(savedProgress);
            // Get progress for current month
            const progressMap = allProgressData[this.month] || {};

            // Merge saved progress with problem data (using ouyId as key)
            this.problems = problemsData.map(problem => {
                let status = progressMap[problem.ouyId];

                // Migrate old status values to new ones
                if (status === 'not-started' || status === 'in-progress') {
                    status = null; // Treat as not-completed (no need to store)
                } else if (status === 'completed') {
                    // Old "completed" becomes "4th-plus" (lowest completion)
                    status = COMPLETION_STATUS.FOURTH_PLUS;
                }

                // If no status or not-completed, use null (implicit not-completed)
                if (!status || status === COMPLETION_STATUS.NOT_COMPLETED) {
                    status = null;
                }

                return {
                    ...problem,
                    status: status
                };
            });
        } else {
            // Initialize with default status (null = not-completed)
            this.problems = problemsData.map(problem => ({
                ...problem,
                status: null
            }));
        }
    }

    saveToLocalStorage() {
        // Load existing data for all months
        const savedProgress = localStorage.getItem('bouldering-progress');
        const allProgressData = savedProgress ? JSON.parse(savedProgress) : {};

        // Update only current month's data (using ouyId as key)
        const monthProgressMap = {};
        this.problems.forEach(problem => {
            if (problem.status && problem.status !== COMPLETION_STATUS.NOT_COMPLETED) {
                monthProgressMap[problem.ouyId] = problem.status;
            }
        });

        // Store with month key
        allProgressData[this.month] = monthProgressMap;

        localStorage.setItem('bouldering-progress', JSON.stringify(allProgressData));
    }

    updateProblemStatus(problemOuyId, newStatus) {
        const problem = this.problems.find(p => p.ouyId === problemOuyId);
        if (problem) {
            // Toggle logic: if clicking the same status, reset to not-completed (null)
            if (problem.status === newStatus) {
                problem.status = null; // null = not-completed
            } else {
                problem.status = newStatus;
            }

            this.saveToLocalStorage();
            this.renderProblems();
            this.updateLadderGrid();
            this.updateStats();
        }
    }

    calculateTotalPoints() {
        return this.problems.reduce((total, problem) => {
            // Skip bonus problem (id 21) - it doesn't contribute to points
            if (problem.id === 21) {
                return total;
            }
            // null/undefined = not-completed = 0 points
            const points = problem.status ? POINTS[problem.status] : 0;
            return total + points;
        }, 0);
    }

    getCompletionStats() {
        const total = this.problems.length;
        const completed = this.problems.filter(p =>
            p.status && p.status !== COMPLETION_STATUS.NOT_COMPLETED
        ).length;
        const firstAttempts = this.problems.filter(p =>
            p.status === COMPLETION_STATUS.FIRST_ATTEMPT
        ).length;
        const points = this.calculateTotalPoints();
        // Max points excludes bonus problem (20 regular problems × 10 points)
        const maxPoints = (total - 1) * 10; // Subtract 1 for bonus problem

        return { total, completed, firstAttempts, points, maxPoints };
    }

    updateStats() {
        const stats = this.getCompletionStats();

        document.getElementById('firstAttempts').textContent = stats.firstAttempts;
        document.getElementById('totalPoints').textContent = stats.points;
        document.getElementById('maxPoints').textContent = stats.maxPoints;

        // Update progress as "completed / total"
        document.getElementById('progressPercentage').textContent = `${stats.completed}/${stats.total}`;
    }

    getFilteredProblems() {
        const areaFilter = document.getElementById('areaFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        return this.problems.filter(problem => {
            const matchesArea = areaFilter === 'all' || problem.area === areaFilter;

            let matchesStatus = true;
            if (statusFilter === 'completed') {
                matchesStatus = problem.status && problem.status !== COMPLETION_STATUS.NOT_COMPLETED;
            } else if (statusFilter === 'in-progress') {
                matchesStatus = !problem.status || problem.status === COMPLETION_STATUS.NOT_COMPLETED;
            } else if (statusFilter !== 'all') {
                matchesStatus = problem.status === statusFilter;
            }

            return matchesArea && matchesStatus;
        }).sort((a, b) => a.id - b.id); // Sort by id to ensure consistent display order
    }

    getColorIndicatorStyle(color) {
        const parts = (color || '').trim().split(/\s+/);
        if (parts.length === 2 && parts[0].startsWith('#') && parts[1].startsWith('#')) {
            return `background: linear-gradient(135deg, ${parts[0]} 50%, ${parts[1]} 50%)`;
        }
        return `background-color: ${color}`;
    }

    renderProblems() {
        const problemsList = document.getElementById('problemsList');
        const filteredProblems = this.getFilteredProblems();

        if (filteredProblems.length === 0) {
            problemsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No problems match the current filters.</p>';
            return;
        }

        problemsList.innerHTML = filteredProblems.map(problem => {
            // Bonus problem (id 21) shows special indicator instead of points
            const isBonus = problem.id === 21;
            const points = isBonus ? 0 : (problem.status ? POINTS[problem.status] : 0);
            const pointsDisplay = isBonus ? '🎟️ Bonus' : `${points} pts`;
            const statusClass = problem.status || COMPLETION_STATUS.NOT_COMPLETED;

            return `
                <div class="problem-card ${statusClass} ${isBonus ? 'bonus-problem' : ''}" data-ouy-id="${problem.ouyId}">
                    <div class="problem-info">
                        <span class="problem-name">${problem.name}</span>
                        <span class="problem-location">(at ${problem.area})</span>
                        <div class="problem-color-indicator" style="${this.getColorIndicatorStyle(problem.color)}"></div>
                        <span class="problem-points ${isBonus ? 'bonus-indicator' : ''}">${pointsDisplay}</span>
                    </div>
                    <div class="problem-status">
                        <button class="attempt-btn first ${problem.status === COMPLETION_STATUS.FIRST_ATTEMPT ? 'active' : ''}"
                                data-ouy-id="${problem.ouyId}"
                                data-status="${COMPLETION_STATUS.FIRST_ATTEMPT}"
                                title="${isBonus ? 'Completed - enters raffle' : '10 points'}">
                            1st
                        </button>
                        <button class="attempt-btn second ${problem.status === COMPLETION_STATUS.SECOND_ATTEMPT ? 'active' : ''}"
                                data-ouy-id="${problem.ouyId}"
                                data-status="${COMPLETION_STATUS.SECOND_ATTEMPT}"
                                title="${isBonus ? 'Completed - enters raffle' : '7 points'}">
                            2nd
                        </button>
                        <button class="attempt-btn third ${problem.status === COMPLETION_STATUS.THIRD_ATTEMPT ? 'active' : ''}"
                                data-ouy-id="${problem.ouyId}"
                                data-status="${COMPLETION_STATUS.THIRD_ATTEMPT}"
                                title="${isBonus ? 'Completed - enters raffle' : '4 points'}">
                            3rd
                        </button>
                        <button class="attempt-btn fourth ${problem.status === COMPLETION_STATUS.FOURTH_PLUS ? 'active' : ''}"
                                data-ouy-id="${problem.ouyId}"
                                data-status="${COMPLETION_STATUS.FOURTH_PLUS}"
                                title="${isBonus ? 'Completed - enters raffle' : '1 point'}">
                            4+
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers to attempt buttons
        document.querySelectorAll('.attempt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const problemOuyId = btn.dataset.ouyId;
                const newStatus = btn.dataset.status;
                this.updateProblemStatus(problemOuyId, newStatus);
            });
        });
    }

    updateLadderGrid() {
        // Always clear all ladder boxes first — ensures empty state when no problems exist for the month
        document.querySelectorAll('.ladder-box').forEach(box => {
            box.classList.remove('completed-1st', 'completed-2nd', 'completed-3rd', 'completed-4th');
        });

        // Update the visual ladder grid based on completion status
        this.problems.forEach(problem => {
            const ladderBox = document.querySelector(`.ladder-box[data-ladder="${problem.id}"]`);
            if (ladderBox) {
                // Add appropriate class based on status (null = no class added)

                // Add appropriate class based on status (null = no class added)
                if (problem.status) {
                    switch(problem.status) {
                        case COMPLETION_STATUS.FIRST_ATTEMPT:
                            ladderBox.classList.add('completed-1st');
                            break;
                        case COMPLETION_STATUS.SECOND_ATTEMPT:
                            ladderBox.classList.add('completed-2nd');
                            break;
                        case COMPLETION_STATUS.THIRD_ATTEMPT:
                            ladderBox.classList.add('completed-3rd');
                            break;
                        case COMPLETION_STATUS.FOURTH_PLUS:
                            ladderBox.classList.add('completed-4th');
                            break;
                    }
                }
            }
        });
    }

    populateAreaFilter() {
        const areas = [...new Set(this.problems.map(p => p.area))];
        const areaFilter = document.getElementById('areaFilter');

        // Remove all options except the first ("All Areas") before repopulating
        while (areaFilter.options.length > 1) {
            areaFilter.remove(1);
        }
        // areaFilter.value = 'all'; // explicitly reset to "All Areas"

        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaFilter.appendChild(option);
        });

        areaFilter.selectedIndex = 0; // explicitly reset to "All Areas"
        const event = new Event('change', { bubbles: true });
        areaFilter.dispatchEvent(event); // dispatch change event
    }

    attachEventListeners() {
        this._onAreaChange = () => this.renderProblems();
        this._onStatusChange = () => this.renderProblems();
        this._onLadderClick = (e) => this.scrollToProblem(parseInt(e.currentTarget.dataset.ladder));

        document.getElementById('areaFilter').addEventListener('change', this._onAreaChange);
        document.getElementById('statusFilter').addEventListener('change', this._onStatusChange);
        document.querySelectorAll('.ladder-box').forEach(box => {
            box.addEventListener('click', this._onLadderClick);
        });
    }

    scrollToProblem(ladderId) {
        const problem = this.problems.find(p => p.id === ladderId);
        if (!problem) return;

        // Check if the problem's area is currently filtered out
        const areaFilter = document.getElementById('areaFilter');
        if (areaFilter.value !== 'all' && areaFilter.value !== problem.area) {
            // Change filter to show this problem's area
            areaFilter.value = problem.area;
        }

        // Check if the problem's completion status is filtered out
        const statusFilter = document.getElementById('statusFilter');
        const isCompleted = problem.status && problem.status !== COMPLETION_STATUS.NOT_COMPLETED;

        // If status filter would hide this problem, set it to 'all'
        if ((statusFilter.value === 'completed' && !isCompleted) ||
            (statusFilter.value === 'in-progress' && isCompleted)) {
            statusFilter.value = 'all';
        }

        // Re-render problems with updated filters
        this.renderProblems();

        // Find the problem card in the DOM (after re-rendering)
        const problemCard = document.querySelector(`.problem-card[data-ouy-id="${problem.ouyId}"]`);
        if (problemCard) {
            // Scroll to the problem card with smooth behavior
            problemCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add flash animation
            problemCard.classList.add('flash-highlight');

            // Remove animation class after it completes
            setTimeout(() => {
                problemCard.classList.remove('flash-highlight');
            }, 1000);
        }
    }
}

// ============================================
// INITIALIZE APP
// ============================================

// ============================================
// MONTH NAVIGATION
// ============================================

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

function getAvailableMonths() {
    return Object.keys(PROBLEMS_BY_MONTH).sort();
}

function updateSubtitle(displayMonth) {
    const subtitleElement = document.getElementById('subtitle');
    if (!subtitleElement) return;
    const [, month] = displayMonth.split('-');
    const label = MONTH_NAMES[parseInt(month, 10) - 1];
    const isCurrentMonth = displayMonth === CURRENT_MONTH;
    const hasData = !!PROBLEMS_BY_MONTH[displayMonth];
    let html = `Track your progress for <strong>${label}</strong>`;
    if (isCurrentMonth && !hasData) {
        html += ` <span class="getting-ready">(getting ready)</span>`;
    }
    subtitleElement.innerHTML = html;
}

function updateMonthNavButtons(displayMonth) {
    const available = getAvailableMonths();
    const hasPrev = available.some(m => m < displayMonth);
    // Allow forward navigation to any later month with data, OR to CURRENT_MONTH itself even without data
    const hasNext = displayMonth < CURRENT_MONTH;
    document.getElementById('prevMonthBtn').disabled = !hasPrev;
    document.getElementById('nextMonthBtn').disabled = !hasNext;
}

function switchToMonth(newMonth) {
    window.tracker.dispose(); // clean up before replacing
    window.tracker = new BoulderingTracker(newMonth);
    updateSubtitle(newMonth);
    updateMonthNavButtons(newMonth);
}

// ============================================
// PROGRESS EVOLUTION VIEW
// ============================================

function getAllMonthsRange() {
    const configuredMonths = Object.keys(PROBLEMS_BY_MONTH).sort();
    if (configuredMonths.length === 0) return [CURRENT_MONTH];

    const firstMonth = configuredMonths[0];
    const months = [];
    let [y, m] = firstMonth.split('-').map(Number);
    const [cy, cm] = CURRENT_MONTH.split('-').map(Number);

    while (y < cy || (y === cy && m <= cm)) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
        m++;
        if (m > 12) { m = 1; y++; }
    }
    return months;
}

function computeMonthStats(month) {
    const problemsData = PROBLEMS_BY_MONTH[month];
    if (!problemsData) return { points: 0, bonusCompleted: false, hasData: false };

    const savedProgress = localStorage.getItem('bouldering-progress');
    if (!savedProgress) return { points: 0, bonusCompleted: false, hasData: true };

    const allProgressData = JSON.parse(savedProgress);
    const progressMap = allProgressData[month] || {};

    let points = 0;
    let bonusCompleted = false;

    problemsData.forEach(problem => {
        const status = progressMap[problem.ouyId];
        if (!status) return;
        if (problem.id === 21) {
            bonusCompleted = true;
        } else if (POINTS[status]) {
            points += POINTS[status];
        }
    });

    return { points, bonusCompleted, hasData: true };
}

function renderProgressChart() {
    const container = document.getElementById('progressChart');
    const months = getAllMonthsRange();
    const data = months.map(m => ({ month: m, ...computeMonthStats(m) }));

    const W = 600, H = 340;
    const padL = 55, padR = 30, padT = 60, padB = 60;
    const cW = W - padL - padR;
    const cH = H - padT - padB;
    const maxPts = 200;
    const n = months.length;

    const xOf = i => padL + (n <= 1 ? cW / 2 : (i / (n - 1)) * cW);
    const yOf = v => padT + cH - (v / maxPts) * cH;

    const pts = data.map((d, i) => ({ ...d, x: xOf(i), y: yOf(d.points) }));

    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
  <defs>
    <linearGradient id="pgLineGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
    <linearGradient id="pgDotGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
    <filter id="pgGlow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

    // Y gridlines + labels
    [0, 50, 100, 150, 200].forEach(v => {
        const y = yOf(v);
        svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>`;
        svg += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#aaa">${v}</text>`;
    });

    // Axes
    svg += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + cH}" stroke="#e0e0e0" stroke-width="1.5"/>`;
    svg += `<line x1="${padL}" y1="${padT + cH}" x2="${W - padR}" y2="${padT + cH}" stroke="#e0e0e0" stroke-width="1.5"/>`;

    // X-axis labels
    pts.forEach((p, i) => {
        const [year, mon] = p.month.split('-');
        const label = MONTH_NAMES[parseInt(mon, 10) - 1].substring(0, 3);
        svg += `<text x="${p.x}" y="${padT + cH + 18}" text-anchor="middle" font-size="12" fill="#666">${label}</text>`;
        if (i === 0 || p.month.split('-')[0] !== pts[i - 1].month.split('-')[0]) {
            svg += `<text x="${p.x}" y="${padT + cH + 34}" text-anchor="middle" font-size="10" fill="#aaa">${year}</text>`;
        }
    });

    // Y axis title
    svg += `<text transform="rotate(-90)" x="${-(padT + cH / 2)}" y="14" text-anchor="middle" font-size="11" fill="#aaa">Points</text>`;

    // Area fill under the line (only data points)
    const dataPts = pts.filter(p => p.hasData);
    if (dataPts.length > 1) {
        const areaPath = `M ${dataPts[0].x} ${padT + cH} ` +
            dataPts.map(p => `L ${p.x} ${p.y}`).join(' ') +
            ` L ${dataPts[dataPts.length - 1].x} ${padT + cH} Z`;
        svg += `<path d="${areaPath}" fill="url(#pgLineGrad)" opacity="0.08"/>`;

        // Line
        const linePath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        svg += `<path d="${linePath}" fill="none" stroke="url(#pgLineGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#pgGlow)"/>`;
    }

    // Nodes + stars + labels
    pts.forEach((p, i) => {
        // Find delta vs previous month that had data
        let delta = null;
        if (p.hasData) {
            for (let j = i - 1; j >= 0; j--) {
                if (pts[j].hasData) { delta = p.points - pts[j].points; break; }
            }
        }

        if (p.hasData) {
            // Stack: delta (top) → points → star → dot
            const hasStar = p.bonusCompleted;
            const starOffset = hasStar ? 22 : 0;
            const deltaOffset = delta !== null ? 14 : 0;

            // Points label
            if (p.points > 0) {
                const pLabelY = p.y - 16 - starOffset - deltaOffset;
                svg += `<text x="${p.x}" y="${pLabelY}" text-anchor="middle" font-size="11" font-weight="700" fill="#667eea">${p.points}</text>`;
            }
            // Delta label
            if (delta !== null) {
                const sign = delta > 0 ? '+' : '';
                const deltaColor = delta > 0 ? '#2E8B57' : delta < 0 ? '#c0392b' : '#aaa';
                const dLabelY = p.y - 16 - starOffset - deltaOffset + 12;
                svg += `<text x="${p.x}" y="${dLabelY}" text-anchor="middle" font-size="10" font-weight="600" fill="${deltaColor}">${sign}${delta}</text>`;
            }
            // Star for bonus
            if (hasStar) {
                svg += `<text x="${p.x}" y="${p.y - 20}" text-anchor="middle" font-size="18" filter="url(#pgGlow)">⭐</text>`;
            }
            // Dot
            svg += `<g><circle cx="${p.x}" cy="${p.y}" r="7" fill="url(#pgDotGrad)" stroke="white" stroke-width="2.5"/>`;
            const [yr, mo] = p.month.split('-');
            const mName = MONTH_NAMES[parseInt(mo, 10) - 1];
            const deltaStr = delta !== null ? ` (${delta >= 0 ? '+' : ''}${delta})` : '';
            svg += `<title>${mName} ${yr}: ${p.points} pts${deltaStr}${p.bonusCompleted ? ' ⭐ Bonus!' : ''}</title></g>`;
        } else {
            // Hollow dot for months with no ladder set
            svg += `<g><circle cx="${p.x}" cy="${p.y}" r="5" fill="white" stroke="#ccc" stroke-width="2"/>`;
            const [yr, mo] = p.month.split('-');
            svg += `<title>${MONTH_NAMES[parseInt(mo, 10) - 1]} ${yr}: no ladder set</title></g>`;
        }
    });

    svg += `</svg>`;
    container.innerHTML = svg;
}

function initializeProgressView() {
    const evolutionBtn = document.getElementById('evolutionBtn');
    const backBtn = document.getElementById('backFromProgressBtn');
    const progressSection = document.getElementById('progressSection');

    const mainSections = [
        document.querySelector('.stats-section'),
        document.querySelector('.ladder-grid-section'),
        document.querySelector('.filter-section'),
        document.querySelector('.problems-section')
    ];
    const subtitleNav = document.querySelector('.subtitle-nav');
    const evolutionLink = document.querySelector('.evolution-link-hint');

    evolutionBtn.addEventListener('click', () => {
        mainSections.forEach(s => s && (s.style.display = 'none'));
        subtitleNav.style.visibility = 'hidden';
        evolutionLink.style.display = 'none';
        progressSection.style.display = 'block';
        renderProgressChart();
    });

    backBtn.addEventListener('click', () => {
        progressSection.style.display = 'none';
        mainSections.forEach(s => s && (s.style.display = ''));
        subtitleNav.style.visibility = '';
        evolutionLink.style.display = '';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load problem data from external JSON file before initializing the app
    try {
        const response = await fetch('ladder_problems.json');
        if (!response.ok) throw new Error(`Failed to load ladder_problems.json: ${response.status}`);
        PROBLEMS_BY_MONTH = await response.json();
    } catch (err) {
        console.error('Could not load ladder_problems.json:', err);
    }

    window.tracker = new BoulderingTracker(CURRENT_MONTH);
    initializeOverlay();
    initializeShareFunctionality();
    initializeProgressView();

    updateSubtitle(CURRENT_MONTH);
    updateMonthNavButtons(CURRENT_MONTH);

    // Check for share code AFTER tracker is ready so importProgress can always re-render
    checkForShareCode();

    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        const available = getAvailableMonths();
        const prev = available.filter(m => m < window.tracker.month).pop();
        if (prev) switchToMonth(prev);
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        const available = getAvailableMonths();
        // Prefer the nearest future month that has data; otherwise go to CURRENT_MONTH
        const next = available.find(m => m > window.tracker.month && m <= CURRENT_MONTH) || CURRENT_MONTH;
        if (next > window.tracker.month) switchToMonth(next);
    });
});

// ============================================
// INFO OVERLAY FUNCTIONALITY
// ============================================

function initializeOverlay() {
    const overlay = document.getElementById('infoOverlay');
    const infoButton = document.getElementById('infoButton');
    const closeOverlay = document.getElementById('closeOverlay');
    const closeOverlayButton = document.getElementById('closeOverlayButton');
    const expandDetailsBtn = document.getElementById('expandDetailsBtn');
    const expandableDetails = document.getElementById('expandableDetails');

    // Check if user has seen the overlay before
    const hasSeenOverlay = localStorage.getItem('hasSeenInfoOverlay');

    // Show overlay on first visit
    if (!hasSeenOverlay) {
        overlay.classList.add('active');
        localStorage.setItem('hasSeenInfoOverlay', 'true');
    }

    // Expand/collapse details
    expandDetailsBtn.addEventListener('click', () => {
        const isExpanded = expandableDetails.classList.contains('expanded');
        if (isExpanded) {
            expandableDetails.classList.remove('expanded');
            expandDetailsBtn.textContent = 'click here for details';
        } else {
            expandableDetails.classList.add('expanded');
            expandDetailsBtn.textContent = 'hide details';
        }
    });

    // Open overlay when info button is clicked
    infoButton.addEventListener('click', () => {
        overlay.classList.add('active');
    });

    // Close overlay when X button is clicked
    closeOverlay.addEventListener('click', () => {
        overlay.classList.remove('active');
        // Collapse details when closing
        expandableDetails.classList.remove('expanded');
        expandDetailsBtn.textContent = 'click here for details';
    });

    // Close overlay when "Got it!" button is clicked
    closeOverlayButton.addEventListener('click', () => {
        overlay.classList.remove('active');
        // Collapse details when closing
        expandableDetails.classList.remove('expanded');
        expandDetailsBtn.textContent = 'click here for details';
    });

    // Close overlay when clicking outside the content
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            // Collapse details when closing
            expandableDetails.classList.remove('expanded');
            expandDetailsBtn.textContent = 'click here for details';
        }
    });

    // Close overlay on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            // Collapse details when closing
            expandableDetails.classList.remove('expanded');
            expandDetailsBtn.textContent = 'click here for details';
        }
    });
}

// ============================================
// SHARE FUNCTIONALITY
// ============================================

function checkForShareCode() {
    // Check URL hash for share code (e.g., example.com/#3189361a61a61a61a2)
    const hash = window.location.hash.slice(1); // Remove the # symbol

    const shareCode = hash || null;

    if (shareCode && shareCode.length > 0 && shareCode.length % 18 === 0) {
        console.log('='.repeat(60));
        console.log('SHARE CODE DETECTED IN URL');
        console.log('='.repeat(60));
        console.log('Share code:', shareCode);
        console.log('Months in code:', shareCode.length / 18);
        console.log('');

        const decoded = decodeShareCodeToProgress(shareCode);

        if (decoded) {
            console.log('Decoded successfully!');
            console.log('');
            console.log('Months:', decoded.months.join(', '));
            console.log('');
            console.log('localStorage-compatible JSON:');
            console.log(JSON.stringify(decoded.localStorageData, null, 2));
            console.log('');

            // Check if there's existing progress
            const existingProgress = localStorage.getItem('bouldering-progress');

            if (!existingProgress) {
                // No existing progress - import directly
                importProgress(decoded.localStorageData);
                console.log('Progress imported successfully (no existing data).');
                console.log('='.repeat(60));
            } else {
                // Existing progress found - show confirmation
                console.log('Existing progress found - waiting for user confirmation.');
                console.log('='.repeat(60));
                showImportConfirmation(decoded.localStorageData);
            }
        } else {
            console.error('Failed to decode share code');
        }
    }
}

function importProgress(localStorageData) {
    const existingProgress = localStorage.getItem('bouldering-progress');
    const allProgressData = existingProgress ? JSON.parse(existingProgress) : {};

    // Only merge months that have actual progress — never overwrite existing data with empty months
    const importedMonths = [];
    Object.entries(localStorageData).forEach(([month, progressMap]) => {
        if (Object.keys(progressMap).length > 0) {
            allProgressData[month] = progressMap;
            importedMonths.push(month);
        }
    });

    localStorage.setItem('bouldering-progress', JSON.stringify(allProgressData));
    window.history.replaceState({}, document.title, window.location.pathname);

    // Navigate to the most relevant month:
    // prefer CURRENT_MONTH if it has imported data, otherwise the most recent imported month
    const sortedImported = importedMonths.sort();
    const targetMonth = sortedImported.includes(CURRENT_MONTH)
        ? CURRENT_MONTH
        : sortedImported[sortedImported.length - 1];

    if (targetMonth && PROBLEMS_BY_MONTH[targetMonth] && window.tracker) {
        if (targetMonth !== window.tracker.month) {
            switchToMonth(targetMonth);
        } else {
            window.tracker.loadFromLocalStorage();
            window.tracker.renderProblems();
            window.tracker.updateLadderGrid();
            window.tracker.updateStats();
        }
    }

    showToast('Progress imported successfully!', 'success', 5000);
}

function showImportConfirmation(localStorageData) {
    const overlay = document.getElementById('importConfirmOverlay');
    const confirmButton = document.getElementById('confirmImportButton');
    const cancelButton = document.getElementById('cancelImportButton');

    // Show overlay
    overlay.classList.add('active');

    // Handle confirm button
    const handleConfirm = () => {
        importProgress(localStorageData);
        overlay.classList.remove('active');
        cleanup();
    };

    // Handle cancel button
    const handleCancel = () => {
        // Remove share code from URL without importing
        window.history.replaceState({}, document.title, window.location.pathname);
        overlay.classList.remove('active');
        cleanup();
    };

    // Cleanup function to remove event listeners
    const cleanup = () => {
        confirmButton.removeEventListener('click', handleConfirm);
        cancelButton.removeEventListener('click', handleCancel);
        overlay.removeEventListener('click', handleOverlayClick);
        document.removeEventListener('keydown', handleEscape);
    };

    // Close overlay when clicking outside
    const handleOverlayClick = (e) => {
        if (e.target === overlay) {
            handleCancel();
        }
    };

    // Close overlay on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            handleCancel();
        }
    };

    // Attach event listeners
    confirmButton.addEventListener('click', handleConfirm);
    cancelButton.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlayClick);
    document.addEventListener('keydown', handleEscape);
}

function initializeShareFunctionality() {
    const shareButton = document.getElementById('shareButton');
    const shareAllButton = document.getElementById('shareAllButton');
    const shareOverlay = document.getElementById('shareOverlay');
    const closeShareOverlay = document.getElementById('closeShareOverlay');
    const shareLinkInput = document.getElementById('shareLink');
    const copyLinkButton = document.getElementById('copyLinkButton');
    const shareOverlayTitle = shareOverlay.querySelector('h2');
    const shareAllHint = shareOverlay.querySelector('.share-all-hint');

    let currentMode = 'month'; // 'month' | 'all'

    function getMonthLabel() {
        if (!window.tracker || !window.tracker.month) return 'this month';
        const [year, mon] = window.tracker.month.split('-');
        return new Date(parseInt(year), parseInt(mon) - 1, 1)
            .toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    function setMonthMode() {
        currentMode = 'month';
        const shareCode = encodeMonthProgressToShareCode(window.tracker.problems, window.tracker.month);
        shareLinkInput.value = `${SHARE_BASE_URL}/#${shareCode}`;
        shareOverlayTitle.textContent = 'Share or Save this month';
        shareAllHint.textContent = 'Want to back up or share all months?';
        shareAllButton.textContent = 'Generate full progress link \u2192';
        console.log('Generated share code:', shareCode);
    }

    function setAllMonthsMode() {
        currentMode = 'all';
        const shareCode = encodeProgressToShareCode();
        shareLinkInput.value = `${SHARE_BASE_URL}/#${shareCode}`;
        shareOverlayTitle.textContent = 'Share or Save all months';
        shareAllHint.textContent = `Just want ${getMonthLabel()}?`;
        shareAllButton.textContent = `Generate ${getMonthLabel()} link \u2192`;
        console.log('Generated full progress share code:', shareCode);
    }

    // Open share overlay — always starts in month mode
    shareButton.addEventListener('click', () => {
        setMonthMode();
        shareOverlay.classList.add('active');
    });

    // Toggle between month / all-months
    shareAllButton.addEventListener('click', () => {
        if (currentMode === 'month') {
            setAllMonthsMode();
        } else {
            setMonthMode();
        }
    });

    // Close share overlay
    closeShareOverlay.addEventListener('click', () => {
        shareOverlay.classList.remove('active');
    });

    // Close overlay when clicking outside
    shareOverlay.addEventListener('click', (e) => {
        if (e.target === shareOverlay) {
            shareOverlay.classList.remove('active');
        }
    });

    // Close overlay on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && shareOverlay.classList.contains('active')) {
            shareOverlay.classList.remove('active');
        }
    });

    // Copy link to clipboard
    copyLinkButton.addEventListener('click', async () => {
        const url = shareLinkInput.value;
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard!');
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            shareLinkInput.select();
            document.execCommand('copy');
            showToast('Link copied to clipboard!');
        }
    });
}

function showToast(message, type = 'default', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    // Set message
    toastMessage.textContent = message;

    // Set icon and style based on type
    if (type === 'success') {
        toastIcon.textContent = '✓';
        toast.classList.add('success');
    } else {
        toastIcon.textContent = '';
        toast.classList.remove('success');
    }

    toast.classList.add('show');

    // Hide toast after specified duration
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}