from fastapi import FastAPI, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware # ייבוא שומר הסף
from rembg import remove

app = FastAPI()

# הגדרת ה-CORS כדי לאפשר לאתר שלנו לתקשר עם השרת
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # מאפשר לכל כתובת לגשת (נוח לפיתוח)
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/remove-bg")
async def remove_background(file: UploadFile):
    input_image = await file.read()
    output_image = remove(input_image)
    return Response(content=output_image, media_type="image/png")