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
        } else {
            uploadTextEl.textContent = 'לחץ כאן לבחירת תמונה';
            uploadTextEl.style.color = '#718096';
            uploadTextEl.style.fontWeight = 'normal';
            setStatus('');
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

        } catch (err) {
            console.error('Network error', err);
            setStatus('שגיאת תקשורת. ודא שהשרת זמין ונסה שוב.', 'error');
        } finally {
            loader.style.display = 'none';
            loader.setAttribute('aria-hidden', 'true');
            removeBtn.disabled = false;
        }
    });
});