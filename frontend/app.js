// תוספת חדשה: מאזין לשינוי בבחירת הקובץ - כדי להראות למשתמש שהתמונה נבחרה בהצלחה!
document.getElementById('imageInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const uploadText = document.querySelector('.upload-text');
    if (file) {
        uploadText.textContent = `תמונה נבחרה: ${file.name}`;
        uploadText.style.color = '#48bb78'; // צובע את הטקסט לירוק
        uploadText.style.fontWeight = 'bold';
    } else {
        uploadText.textContent = 'לחץ כאן לבחירת תמונה';
        uploadText.style.color = '#718096';
        uploadText.style.fontWeight = 'normal';
    }
});

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

    removeBtn.style.display = 'none';
    loader.style.display = 'block';

    try {
        // הנה התיקון הקריטי! ודאנו ש- /remove-bg נמצא בסוף הכתובת
        const response = await fetch('https://backroundremover-production.up.railway.app/remove-bg', { 
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            resultImage.src = url;
            downloadLink.href = url;
            downloadLink.download = 'removed_bg.png';
            downloadLink.style.display = 'block';
        } else {
            alert("שגיאה מהשרת: לא ניתן היה להסיר את הרקע. נסה שוב.");
        }
    } catch (error) {
        alert("שגיאת תקשורת. ודא שהכתובת מדויקת והשרת באוויר.");
    } finally {
        loader.style.display = 'none';
        removeBtn.style.display = 'inline-block';
    }
});