from fastapi import FastAPI, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session # ייבוא של יוצר הסשנים

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# הגדרת סשן קבוע שמשתמש במודל ה"לייט" שדורש פחות זיכרון
my_session = new_session("u2netp")

@app.post("/remove-bg")
async def remove_background(file: UploadFile):
    input_image = await file.read()
    
    # הפעלת הסרת הרקע עם מודל הלייט
    output_image = remove(input_image, session=my_session)
    
    return Response(content=output_image, media_type="image/png")