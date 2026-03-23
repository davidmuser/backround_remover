document.getElementById('removeBtn').addEventListener('click', async () => {
    const imageInput = document.getElementById('imageInput');
    const resultImage = document.getElementById('resultImage');
    const downloadLink = document.getElementById('downloadLink');
    const removeBtn = document.getElementById('removeBtn');
    const loader = document.getElementById('loader');

    if (imageInput.files.length === 0) {
        alert("אנא בחר תמונה תחילה!");
        return;
    }

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    // הפעלת מצב טעינה (הסתרת כפתור, הצגת הודעה)
    removeBtn.style.display = 'none';
    loader.style.display = 'block';

    try {
        const response = await fetch('https://backroundremover-production.up.railway.app/remove-bg', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // הצגת התמונה באתר
            resultImage.src = url;
            
            // הגדרת לינק להורדה
            downloadLink.href = url;
            downloadLink.download = 'removed_bg.png';
            downloadLink.style.display = 'block';
        } else {
            alert("משהו השתבש עם השרת. אנא נסה שוב.");
        }
    } catch (error) {
        alert("שגיאת תקשורת. ודא שהשרת ב-Railway רץ.");
    } finally {
        // ביטול מצב טעינה (החזרת הכפתור, הסתרת ההודעה)
        loader.style.display = 'none';
        removeBtn.style.display = 'inline-block';
    }
});