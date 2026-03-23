// Frontend behavior: defensive and accessible
document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const uploadTextEl = document.querySelector('.upload-text');
    const removeBtn = document.getElementById('removeBtn');
    const resultImage = document.getElementById('resultImage');
    const downloadLink = document.getElementById('downloadLink');
    const loader = document.getElementById('loader');
    const statusEl = document.getElementById('status');

    const backendBase = (window.BACKEND_URL && window.BACKEND_URL.trim()) || 'https://backroundremover-production.up.railway.app';
    const REMOVE_ENDPOINT = backendBase.replace(/\/$/, '') + '/remove-bg';

    if (!imageInput || !uploadTextEl || !removeBtn || !resultImage || !downloadLink || !loader || !statusEl) {
        console.error('Missing required DOM elements for frontend app');
        return;
    }

    // Helper to set status message (info / error / success)
    function setStatus(message, type = 'info') {
        statusEl.textContent = message || '';
        statusEl.classList.remove('error', 'success');
        if (type === 'error') statusEl.classList.add('error');
        if (type === 'success') statusEl.classList.add('success');
    }

    // Update upload label when a file is chosen
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            uploadTextEl.textContent = `תמונה נבחרה: ${file.name}`;
            uploadTextEl.style.color = '#48bb78';
            uploadTextEl.style.fontWeight = 'bold';
            setStatus('קובץ מוכן לשליחה', 'success');
            // show small preview thumbnail in upload box
            const preview = document.getElementById('previewThumb');
            if (preview) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        } else {
            uploadTextEl.textContent = 'לחץ כאן לבחירת תמונה';
            uploadTextEl.style.color = '#718096';
            uploadTextEl.style.fontWeight = 'normal';
            setStatus('');
            const preview = document.getElementById('previewThumb');
            if (preview) { preview.src = ''; preview.style.display = 'none'; }
        }
    });

    // Track last object URL for cleanup
    let lastObjectUrl = null;

    removeBtn.addEventListener('click', async () => {
        setStatus('');

        if (!imageInput.files || imageInput.files.length === 0) {
            setStatus('אנא בחר תמונה תחילה!', 'error');
            return;
        }

        const file = imageInput.files[0];
        const MAX_BYTES = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_BYTES) {
            setStatus('הקובץ גדול מדי. נא להעלות קובץ עד 10MB.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

    // Enter loading state
    removeBtn.disabled = true;
    loader.style.display = 'block';
    loader.setAttribute('aria-hidden', 'false');
    // show fake progress bar animation to indicate activity
    const progressWrapper = document.querySelector('.progress-wrapper');
    const progressFill = document.querySelector('.progress-fill');
    if (progressWrapper && progressFill) { progressWrapper.style.display = 'block'; progressFill.style.width = '6%'; }
    setStatus('שולח קובץ לשרת...', 'info');

        try {
            const response = await fetch(REMOVE_ENDPOINT, { method: 'POST', body: formData });

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                console.error('Server error', response.status, text);
                setStatus('שגיאה מהשרת: לא ניתן היה להסיר את הרקע. נסה שוב.', 'error');
                return;
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.startsWith('image/')) {
                const txt = await response.text().catch(() => '');
                console.error('Unexpected response', contentType, txt);
                setStatus('השרת החזיר תשובה לא תקינה. נסה שוב.', 'error');
                return;
            }

            const blob = await response.blob();

            // animate progress to completion (fake, since fetch doesn't give request progress)
            if (progressFill) { progressFill.style.width = '90%'; }

            // Cleanup previous URL
            if (lastObjectUrl) {
                try { URL.revokeObjectURL(lastObjectUrl); } catch (e) { /* ignore */ }
                lastObjectUrl = null;
            }

            const url = URL.createObjectURL(blob);
            lastObjectUrl = url;

            resultImage.src = url;
            resultImage.alt = 'תמונה לאחר הסרת רקע';
            downloadLink.href = url;
            downloadLink.download = 'removed_bg.png';
            downloadLink.style.display = 'inline-block';
            downloadLink.setAttribute('aria-hidden', 'false');

            setStatus('ההסרה הושלמה — אפשר להוריד את התמונה.', 'success');

            // Revoke the object URL shortly after download to free memory
            downloadLink.addEventListener('click', () => {
                setTimeout(() => {
                    try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
                    if (lastObjectUrl === url) lastObjectUrl = null;
                }, 1000);
            }, { once: true });

            if (progressFill) { progressFill.style.width = '100%'; setTimeout(() => { const pw = document.querySelector('.progress-wrapper'); if (pw) pw.style.display='none'; }, 300); }

        } catch (err) {
            console.error('Network error', err);
            setStatus('שגיאת תקשורת. ודא שהשרת זמין ונסה שוב.', 'error');
        } finally {
            loader.style.display = 'none';
            loader.setAttribute('aria-hidden', 'true');
            removeBtn.disabled = false;
            // hide progress if still visible
            const pw = document.querySelector('.progress-wrapper'); if (pw) pw.style.display='none';
        }
    });

    // Drag & drop support for the upload box
    const uploadBox = document.getElementById('uploadBox');
    if (uploadBox) {
        ['dragenter','dragover'].forEach(evt => uploadBox.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); uploadBox.classList.add('dragover'); }));
        ['dragleave','drop','dragend'].forEach(evt => uploadBox.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); uploadBox.classList.remove('dragover'); }));
        uploadBox.addEventListener('drop', (e) => {
            const dt = e.dataTransfer; if (!dt) return;
            const files = dt.files; if (!files || files.length === 0) return;
            // assign files to the hidden input so normal flow works
            try {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(files[0]);
                imageInput.files = dataTransfer.files;
                // trigger change event
                imageInput.dispatchEvent(new Event('change'));
            } catch (err) {
                // fallback: just show preview directly
                const file = files[0];
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const preview = document.getElementById('previewThumb');
                    if (preview) { preview.src = ev.target.result; preview.style.display='block'; }
                    uploadTextEl.textContent = `תמונה נבחרה: ${file.name}`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Reset/Clear UI
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // clear inputs and UI
            try { imageInput.value = ''; imageInput.files = null; } catch(e) { imageInput.value = ''; }
            uploadTextEl.textContent = 'לחץ כאן לבחירת תמונה';
            uploadTextEl.style.color = '#718096';
            uploadTextEl.style.fontWeight = 'normal';
            setStatus('');
            const preview = document.getElementById('previewThumb'); if (preview) { preview.src=''; preview.style.display='none'; }
            resultImage.src = '';
            downloadLink.style.display = 'none';
            const pw = document.querySelector('.progress-wrapper'); if (pw) pw.style.display='none';
        });
    }
});