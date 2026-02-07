// ============================================
// PROBLEM DATA CONFIGURATION
// ============================================
// Problems are organized by month in YYYY-MM format
// Later: Move this to a separate problems.json file

// ============================================
// SHARE CONFIGURATION
// ============================================
const SHARE_BASE_URL = 'castle-ladder.short.gy';

// Encoding/Decoding functions for share codes
function encodeProgressToShareCode(problems, month) {
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

function decodeShareCodeToProgress(shareCode) {
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

const PROBLEMS_BY_MONTH = {
    '2026-02': [
        { id: 1, ouyId: "e025878c-8e90-4e82-9e6d-afa72f458ee6", name: "Ladder 1", color: "#2458ac", area: "Panels" },
        { id: 2, ouyId: "5bd20643-74c9-4462-9e68-3d291543adee", name: "Ladder 2", color: "#fafafa", area: "Pen" },
        { id: 3, ouyId: "ef5f9895-3ab6-4a0f-b841-651d1cc45b4f", name: "Ladder 3", color: "#fafafa", area: "Loft Bloc" },
        { id: 4, ouyId: "fe35b919-3b04-4536-ac2e-00530759294b", name: "Ladder 4", color: "#fbff09", area: "Catacomb" },
        { id: 5, ouyId: "be767bd2-a713-465b-8bbb-505801e99c94", name: "Ladder 5", color: "#fbff09", area: "Loft Bloc" },
        { id: 6, ouyId: "6ade6820-3cc7-428b-880f-b114c80ec9e2", name: "Ladder 6", color: "#8338EC", area: "Pump Room" },
        { id: 7, ouyId: "9dade1ed-129d-420a-b70b-768c57cfa9fd", name: "Ladder 7", color: "#ffb20b", area: "Loft" },
        { id: 8, ouyId: "01f5bcc6-d788-4530-9826-69ddb035abd7", name: "Ladder 8", color: "#fbff09", area: "Pen" },
        { id: 9, ouyId: "309c0da4-256d-4b03-ae37-95c4970db833", name: "Ladder 9", color: "#fafafa", area: "Loft" },
        { id: 10, ouyId: "2dedfcb1-c933-4196-a79a-dfdd0d5e490d", name: "Ladder 10", color: "#d71515", area: "Catacomb" },
        { id: 11, ouyId: "e719e0f3-b03a-426e-82e9-377465116c6d", name: "Ladder 11", color: "#d71515", area: "Panels" },
        { id: 12, ouyId: "9736f4b7-c330-4858-b030-52cb7d0c0ef4", name: "Ladder 12", color: "#020707", area: "Loft Bloc" },
        { id: 13, ouyId: "794ee848-46b0-47dd-9e6c-baf4a1d11c60", name: "Ladder 13", color: "#fbff09", area: "Pen" },
        { id: 14, ouyId: "05a0d931-ae3a-46ee-8c40-74f117d91ee5", name: "Ladder 14", color: "#d78ac5", area: "Panels" },
        { id: 15, ouyId: "44baed68-3b58-4c05-a668-c6ea990991f3", name: "Ladder 15", color: "#2458ac", area: "Loft" },
        { id: 16, ouyId: "ddc1e3de-e0ac-4863-8e15-7301d33cde90", name: "Ladder 16", color: "#8338EC", area: "Loft Bloc" },
        { id: 17, ouyId: "d1dc8ea5-d98c-456b-8da9-b7f22e555c7c", name: "Ladder 17", color: "#fafafa", area: "Pen" },
        { id: 18, ouyId: "17f31b20-9dfd-4376-913e-ea780c802e08", name: "Ladder 18", color: "#020707", area: "Catacomb" },
        { id: 19, ouyId: "bf183cc4-ee73-47a2-ae9d-35c58ff339ec", name: "Ladder 19", color: "#020707", area: "Loft Bloc" },
        { id: 20, ouyId: "cbc029e7-122a-458c-a5d0-82dedaa7d597", name: "Ladder 20", color: "#d78ac5", area: "Loft" },
        { id: 21, ouyId: "894782a1-368e-4697-a929-835a278aa69e", name: "Ladder Bonus", color: "#FF6B6B", area: "Loft" },
    ]
    // Future months can be added here:
    // '2026-03': [ ... ],
    // '2026-04': [ ... ],
    // etc.
};

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
        this.renderProblems();
        this.updateLadderGrid();
        this.updateStats();
        this.populateAreaFilter();
        this.attachEventListeners();
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
                        <div class="problem-color-indicator" style="background-color: ${problem.color}"></div>
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
        // Update the visual ladder grid based on completion status
        this.problems.forEach(problem => {
            const ladderBox = document.querySelector(`.ladder-box[data-ladder="${problem.id}"]`);
            if (ladderBox) {
                // Remove all completion classes
                ladderBox.classList.remove('completed-1st', 'completed-2nd', 'completed-3rd', 'completed-4th');
                
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
        
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaFilter.appendChild(option);
        });
    }

    attachEventListeners() {
        document.getElementById('areaFilter').addEventListener('change', () => {
            this.renderProblems();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.renderProblems();
        });
        
        // Add click listeners to ladder boxes
        document.querySelectorAll('.ladder-box').forEach(box => {
            box.addEventListener('click', (e) => {
                const ladderId = parseInt(e.currentTarget.dataset.ladder);
                this.scrollToProblem(ladderId);
            });
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

document.addEventListener('DOMContentLoaded', () => {
    // Check if there's a share code in the URL
    checkForShareCode();
    
    window.tracker = new BoulderingTracker(CURRENT_MONTH);
    initializeOverlay();
    initializeShareFunctionality();
    
    // Update subtitle with current month
    const subtitleElement = document.getElementById('subtitle');
    if (subtitleElement) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        // Parse CURRENT_MONTH (format: 'YYYY-MM')
        const [year, month] = CURRENT_MONTH.split('-');
        const monthIndex = parseInt(month, 10) - 1; // Convert to 0-based index
        const currentMonthName = monthNames[monthIndex];
        subtitleElement.innerHTML = `Track your progress for <strong>${currentMonthName}</strong>`;
    }
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
    
    if (shareCode && shareCode.length === 18) {
        console.log('='.repeat(60));
        console.log('SHARE CODE DETECTED IN URL');
        console.log('='.repeat(60));
        console.log('Share code:', shareCode);
        console.log('');
        
        const decoded = decodeShareCodeToProgress(shareCode);
        
        if (decoded) {
            console.log('Decoded successfully!');
            console.log('');
            console.log('Month:', decoded.month);
            console.log('Raw digits (base-5):', decoded.decodedDigits);
            console.log('');
            console.log('Problem statuses:');
            decoded.statuses.forEach((status, i) => {
                const problemNum = i + 1;
                const displayStatus = status || COMPLETION_STATUS.NOT_COMPLETED;
                console.log(`  Problem ${problemNum}: ${displayStatus}`);
            });
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
    // Import the decoded progress into localStorage
    const existingProgress = localStorage.getItem('bouldering-progress');
    const allProgressData = existingProgress ? JSON.parse(existingProgress) : {};
    
    // Merge the imported data
    Object.assign(allProgressData, localStorageData);
    
    // Save to localStorage
    localStorage.setItem('bouldering-progress', JSON.stringify(allProgressData));
    
    // Remove share code from URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Reload the tracker to reflect imported progress
    if (window.tracker) {
        window.tracker.loadFromLocalStorage();
        window.tracker.renderProblems();
        window.tracker.updateLadderGrid();
        window.tracker.updateStats();
    }
    
    // Show success toast
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
    const shareOverlay = document.getElementById('shareOverlay');
    const closeShareOverlay = document.getElementById('closeShareOverlay');
    const shareLinkInput = document.getElementById('shareLink');
    const openLinkButton = document.getElementById('openLinkButton');
    const copyLinkButton = document.getElementById('copyLinkButton');
    
    // Open share overlay and generate share code
    shareButton.addEventListener('click', () => {
        // Generate share code from current progress (pass month)
        const shareCode = encodeProgressToShareCode(window.tracker.problems, window.tracker.month);
        const shareUrl = `${SHARE_BASE_URL}/#${shareCode}`;
        shareLinkInput.value = shareUrl;
        
        // Debug log
        console.log('Generated share code:', shareCode);
        console.log('Share URL:', shareUrl);
        
        shareOverlay.classList.add('active');
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
    
    // Open link in new tab
    openLinkButton.addEventListener('click', () => {
        const url = shareLinkInput.value;
        window.open(`https://${url}`, '_blank', 'noopener,noreferrer');
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
