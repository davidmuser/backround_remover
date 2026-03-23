document.getElementById('removeBtn').addEventListener('click', async () => {
    const imageInput = document.getElementById('imageInput');
    const resultImage = document.getElementById('resultImage');
    const downloadLink = document.getElementById('downloadLink');

    if (imageInput.files.length === 0) {
        alert("Please select an image first!");
        return;
    }

    const formData = new FormData();
    // חשוב מאוד: השם 'file' חייב להתאים למה שכתבנו ב-Python ב-main.py
    formData.append('file', imageInput.files[0]);

    // שליחת התמונה לשרת
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
        alert("Something went wrong with the server.");
    }
});