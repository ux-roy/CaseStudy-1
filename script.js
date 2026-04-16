document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-body');
    const saveBtn = document.getElementById('save-btn');
    const toast = document.getElementById('toast');
    const navItems = document.querySelectorAll('.nav-item');
    const errorLog = document.getElementById('error-log');
    const errorList = document.getElementById('error-list');
    const errorCountSpan = document.getElementById('error-count');
    const resolvedCountSpan = document.getElementById('resolved-count');
    const cellTooltip = document.getElementById('cell-tooltip');

    // State for errors
    let activeErrors = [];

    function showTooltip(e, text) {
        cellTooltip.textContent = text;
        const rect = e.target.getBoundingClientRect();
        
        // Position above the cell
        cellTooltip.style.left = `${rect.left + (rect.width / 2) - (cellTooltip.offsetWidth / 2)}px`;
        cellTooltip.style.top = `${rect.top - cellTooltip.offsetHeight - 10}px`;
        cellTooltip.classList.add('show');
    }

    function hideTooltip() {
        cellTooltip.classList.remove('show');
    }

    // Populate Table with initial data
    const rowCount = 100;
    const colCount = 10;
    
    // Choose 5 random rows for errors (to test scrolling)
    const errorRowIndices = [];
    while(errorRowIndices.length < 5) {
        const r = Math.floor(Math.random() * rowCount) + 1;
        if(!errorRowIndices.includes(r)) errorRowIndices.push(r);
    }

    for (let i = 1; i <= rowCount; i++) {
        const tr = document.createElement('tr');
        
        const tdSn = document.createElement('td');
        tdSn.textContent = i;
        tdSn.classList.add('sticky-col');
        tr.appendChild(tdSn);

        for (let j = 2; j <= colCount; j++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            
            const randomVal = Math.floor(Math.random() * 9000) + 1000;
            input.value = randomVal;

            if (errorRowIndices.includes(i) && activeErrors.length < 5) {
                // Determine error type
                const errorTypes = [
                    { msg: "Invalid entry", val: "N/A", suggestion: "Only 4 digits numerical numbers" },
                    { msg: "Incorrect format", val: "12-X", suggestion: "Remove non-numeric characters" },
                    { msg: "Value error", val: "0.5", suggestion: "Must be a whole number \u2265 1000" }
                ];
                const error = errorTypes[activeErrors.length % 3];
                input.value = error.val;
                input.classList.add('cell-error');
                
                const errorObj = {
                    id: `err-${activeErrors.length}`,
                    message: error.msg,
                    suggestion: error.suggestion,
                    row: i,
                    col: j,
                    element: input,
                    resolved: false
                };
                activeErrors.push(errorObj);
                const rowIdx = errorRowIndices.indexOf(i);
                errorRowIndices.splice(rowIdx, 1);

                input.addEventListener('mouseenter', (e) => {
                    if (!errorObj.resolved) showTooltip(e, errorObj.suggestion);
                });
                input.addEventListener('mouseleave', hideTooltip);
            }

            input.addEventListener('input', () => {
                hideTooltip();
                const err = activeErrors.find(e => e.element === input);
                if (err && !err.resolved) {
                    if (/^\d{4}$/.test(input.value)) {
                        err.resolved = true;
                        input.classList.remove('cell-error');
                        updateErrorLog();
                    }
                }
            });

            td.appendChild(input);
            tr.appendChild(td);
        }
        tableBody.appendChild(tr);
    }

    function updateErrorLog() {
        errorList.innerHTML = '';
        const resolvedCount = activeErrors.filter(e => e.resolved).length;
        
        // Counter format: Resolved / Total
        resolvedCountSpan.textContent = `${resolvedCount}/${activeErrors.length}`;
        errorCountSpan.textContent = activeErrors.length;

        activeErrors.forEach((err, index) => {
            const item = document.createElement('div');
            item.className = `error-item ${err.resolved ? 'resolved' : ''}`;
            
            const actionContent = err.resolved 
                ? '<i data-lucide="check-circle-2" class="check-icon"></i>' 
                : `<a class="fix-btn" data-id="${err.id}">Fix Now</a>`;

            item.innerHTML = `
                <span class="col-err">${index + 1}. ${err.message} <span class="error-suggestion">(${err.suggestion})</span></span>
                <span class="col-loc">Row - ${err.row} \u00B7 Column - ${err.col}</span>
                <span class="col-act">${actionContent}</span>
            `;
            errorList.appendChild(item);
        });

        // Initialize icons for the newly added checkmarks
        if (window.lucide) {
            lucide.createIcons();
        }

        // Add event listeners to "Fix Now" links
        document.querySelectorAll('.fix-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const errId = e.target.getAttribute('data-id');
                const err = activeErrors.find(e => e.id === errId);
                if (err) {
                    err.element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    setTimeout(() => err.element.focus(), 500);
                }
            });
        });

        if (resolvedCount === activeErrors.length && activeErrors.length > 0) {
            // All resolved, hide log after a short delay so user sees final checkmark
            setTimeout(() => {
                errorLog.style.display = 'none';
                saveBtn.disabled = false; // Enable save button when errors are gone
                toast.textContent = "All errors resolved! You can now save.";
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }, 1500);
        }
    }

    // Sidebar Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Save Button
    saveBtn.addEventListener('click', () => {
        const resolvedCount = activeErrors.filter(e => e.resolved).length;
        
        if (resolvedCount < activeErrors.length) {
            // Show errors and disable save until resolved
            errorLog.style.display = 'block';
            saveBtn.disabled = true;
            updateErrorLog();
            errorLog.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Standard save flow
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            const successModal = document.getElementById('success-modal');

            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
                
                // Show Success Modal
                successModal.classList.add('show');
                
                // Hide Modal after 2.5 seconds
                setTimeout(() => {
                    successModal.classList.remove('show');
                }, 2500);
            }, 800);
        }
    });
});
