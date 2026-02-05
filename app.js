// ============================================
// PROBLEM DATA CONFIGURATION
// ============================================
// Later: Move this to a separate problems.json file

const PROBLEMS_DATA = [
    { id: 1, name: "Ladder 1", color: "#FF6B6B", area: "Main Wall" },
    { id: 2, name: "Ladder 2", color: "#4ECDC4", area: "Slab Section" },
    { id: 3, name: "Ladder 3", color: "#95E1D3", area: "Cave" },
    { id: 4, name: "Ladder 4", color: "#F38181", area: "Main Wall" },
    { id: 5, name: "Ladder 5", color: "#FFA07A", area: "Training Area" },
    { id: 6, name: "Ladder 6", color: "#98D8C8", area: "Cave" },
    { id: 7, name: "Ladder 7", color: "#FFBE0B", area: "Slab Section" },
    { id: 8, name: "Ladder 8", color: "#8338EC", area: "Main Wall" },
    { id: 9, name: "Ladder 9", color: "#FF6B6B", area: "Training Area" },
    { id: 10, name: "Ladder 10", color: "#4ECDC4", area: "Cave" },
    { id: 11, name: "Ladder 11", color: "#95E1D3", area: "Main Wall" },
    { id: 12, name: "Ladder 12", color: "#F38181", area: "Slab Section" },
    { id: 13, name: "Ladder 13", color: "#FFA07A", area: "Cave" },
    { id: 14, name: "Ladder 14", color: "#98D8C8", area: "Main Wall" },
    { id: 15, name: "Ladder 15", color: "#FFBE0B", area: "Training Area" },
    { id: 16, name: "Ladder 16", color: "#8338EC", area: "Slab Section" },
    { id: 17, name: "Ladder 17", color: "#FF6B6B", area: "Cave" },
    { id: 18, name: "Ladder 18", color: "#4ECDC4", area: "Main Wall" },
    { id: 19, name: "Ladder 19", color: "#95E1D3", area: "Training Area" },
    { id: 20, name: "Ladder 20", color: "#F38181", area: "Slab Section" },
    { id: 21, name: "Ladder Bonus", color: "#FFD700", area: "Cave" },
];

// ============================================
// STATE MANAGEMENT
// ============================================

class BoulderingTracker {
    constructor() {
        this.problems = [];
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.renderProblems();
        this.updateLadderGrid();
        this.populateAreaFilter();
        this.attachEventListeners();
    }

    loadFromLocalStorage() {
        const savedProgress = localStorage.getItem('bouldering-progress');
        
        if (savedProgress) {
            const progressMap = JSON.parse(savedProgress);
            
            // Merge saved progress with problem data
            this.problems = PROBLEMS_DATA.map(problem => ({
                ...problem,
                status: progressMap[problem.id] || 'not-started'
            }));
        } else {
            // Initialize with default status
            this.problems = PROBLEMS_DATA.map(problem => ({
                ...problem,
                status: 'not-started'
            }));
        }
    }

    saveToLocalStorage() {
        // Save only the progress (id -> status mapping)
        const progressMap = {};
        this.problems.forEach(problem => {
            progressMap[problem.id] = problem.status;
        });
        localStorage.setItem('bouldering-progress', JSON.stringify(progressMap));
    }

    updateProblemStatus(problemId, newStatus) {
        const problem = this.problems.find(p => p.id === problemId);
        if (problem) {
            problem.status = newStatus;
            this.saveToLocalStorage();
            this.renderProblems();
            this.updateLadderGrid();
        }
    }

    getFilteredProblems() {
        const areaFilter = document.getElementById('areaFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        return this.problems.filter(problem => {
            const matchesArea = areaFilter === 'all' || problem.area === areaFilter;
            const matchesStatus = statusFilter === 'all' || problem.status === statusFilter;
            return matchesArea && matchesStatus;
        });
    }

    renderProblems() {
        const problemsList = document.getElementById('problemsList');
        const filteredProblems = this.getFilteredProblems();

        if (filteredProblems.length === 0) {
            problemsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No problems match the current filters.</p>';
            return;
        }

        problemsList.innerHTML = filteredProblems.map(problem => `
            <div class="problem-card ${problem.status}" data-id="${problem.id}">
                <div class="problem-info">
                    <span class="problem-name">${problem.name}</span>
                    <span class="problem-location">(at ${problem.area})</span>
                    <div class="problem-color-indicator" style="background-color: ${problem.color}"></div>
                </div>
                <div class="problem-status">
                    <button class="status-btn not-started ${problem.status === 'not-started' ? 'active' : ''}" 
                            data-id="${problem.id}" 
                            data-status="not-started">
                        Not Started
                    </button>
                    <button class="status-btn in-progress ${problem.status === 'in-progress' ? 'active' : ''}" 
                            data-id="${problem.id}" 
                            data-status="in-progress">
                        In Progress
                    </button>
                    <button class="status-btn completed ${problem.status === 'completed' ? 'active' : ''}" 
                            data-id="${problem.id}" 
                            data-status="completed">
                        ✓ Done
                    </button>
                </div>
            </div>
        `).join('');

        // Attach click handlers to status buttons
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const problemId = parseInt(btn.dataset.id);
                const newStatus = btn.dataset.status;
                this.updateProblemStatus(problemId, newStatus);
            });
        });
    }

    updateLadderGrid() {
        // Update the visual ladder grid based on completion status
        this.problems.forEach(problem => {
            const ladderBox = document.querySelector(`.ladder-box[data-ladder="${problem.id}"]`);
            if (ladderBox) {
                if (problem.status === 'completed') {
                    ladderBox.classList.add('completed');
                } else {
                    ladderBox.classList.remove('completed');
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
    }
}

// ============================================
// INITIALIZE APP
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new BoulderingTracker();
});
