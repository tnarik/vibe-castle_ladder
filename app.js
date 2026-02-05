// ============================================
// PROBLEM DATA CONFIGURATION
// ============================================
// Later: Move this to a separate problems.json file

const PROBLEMS_DATA = [
    { id: 1, ouyId: "e025878c-8e90-4e82-9e6d-afa72f458ee6", name: "Ladder 1", color: "#FF6B6B", area: "Panels" },
    { id: 2, ouyId: "5bd20643-74c9-4462-9e68-3d291543adee", name: "Ladder 2", color: "#4ECDC4", area: "Pen" },
    { id: 3, ouyId: "ef5f9895-3ab6-4a0f-b841-651d1cc45b4f", name: "Ladder 3", color: "#95E1D3", area: "Loft Bloc" },
    { id: 4, ouyId: "fe35b919-3b04-4536-ac2e-00530759294b", name: "Ladder 4", color: "#F38181", area: "Catacomb" },
    { id: 5, ouyId: "be767bd2-a713-465b-8bbb-505801e99c94", name: "Ladder 5", color: "#FFA07A", area: "Loft Bloc" },
    { id: 6, ouyId: "6ade6820-3cc7-428b-880f-b114c80ec9e2", name: "Ladder 6", color: "#98D8C8", area: "Pump Room" },
    { id: 7, ouyId: "9dade1ed-129d-420a-b70b-768c57cfa9fd", name: "Ladder 7", color: "#FFBE0B", area: "Loft" },
    { id: 8, ouyId: "01f5bcc6-d788-4530-9826-69ddb035abd7", name: "Ladder 8", color: "#8338EC", area: "Pen" },
    { id: 9, ouyId: "309c0da4-256d-4b03-ae37-95c4970db833", name: "Ladder 9", color: "#FF6B6B", area: "Loft" },
    { id: 10, ouyId: "2dedfcb1-c933-4196-a79a-dfdd0d5e490d", name: "Ladder 10", color: "#4ECDC4", area: "Catacomb" },
    { id: 11, ouyId: "e719e0f3-b03a-426e-82e9-377465116c6d", name: "Ladder 11", color: "#95E1D3", area: "Panels" },
    { id: 12, ouyId: "9736f4b7-c330-4858-b030-52cb7d0c0ef4", name: "Ladder 12", color: "#F38181", area: "Loft Block" },
    { id: 13, ouyId: "794ee848-46b0-47dd-9e6c-baf4a1d11c60", name: "Ladder 13", color: "#FFA07A", area: "Pen" },
    { id: 14, ouyId: "05a0d931-ae3a-46ee-8c40-74f117d91ee5", name: "Ladder 14", color: "#98D8C8", area: "Panels" },
    { id: 15, ouyId: "44baed68-3b58-4c05-a668-c6ea990991f3", name: "Ladder 15", color: "#FFBE0B", area: "Loft" },
    { id: 16, ouyId: "ddc1e3de-e0ac-4863-8e15-7301d33cde90", name: "Ladder 16", color: "#8338EC", area: "Loft Bloc" },
    { id: 17, ouyId: "d1dc8ea5-d98c-456b-8da9-b7f22e555c7c", name: "Ladder 17", color: "#FF6B6B", area: "Pen" },
    { id: 18, ouyId: "17f31b20-9dfd-4376-913e-ea780c802e08", name: "Ladder 18", color: "#4ECDC4", area: "Catacomb" },
    { id: 19, ouyId: "bf183cc4-ee73-47a2-ae9d-35c58ff339ec", name: "Ladder 19", color: "#95E1D3", area: "Loft Bloc" },
    { id: 20, ouyId: "cbc029e7-122a-458c-a5d0-82dedaa7d597", name: "Ladder 20", color: "#F38181", area: "Loft" },
    { id: 21, ouyId: "894782a1-368e-4697-a929-835a278aa69e", name: "Ladder Bonus", color: "#FFD700", area: "Loft" },
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
