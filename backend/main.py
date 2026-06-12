from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image
import io
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PALETTES = {
    "gameboy": [
        (15, 56, 15),
        (48, 98, 48),
        (139, 172, 15),
        (155, 188, 15)
    ],
    "nes": [
        (124, 124, 124), (0, 0, 252), (0, 0, 188), (68, 40, 188), (148, 0, 132), (168, 0, 32), (168, 16, 0),
        (136, 20, 0), (80, 48, 0), (0, 120, 0), (0, 104, 0), (0, 88, 0), (0, 64, 88), (0, 0, 0),
        (188, 188, 188), (0, 120, 248), (0, 88, 248), (104, 68, 252), (216, 0, 204), (228, 0, 88), (248, 56, 0),
        (228, 92, 16), (172, 124, 0), (0, 184, 0), (0, 168, 0), (0, 168, 68), (0, 136, 136), (0, 0, 0),
        (248, 248, 248), (60, 188, 252), (104, 136, 252), (152, 120, 248), (248, 120, 248), (248, 88, 152), (248, 120, 88),
        (252, 160, 68), (248, 184, 0), (184, 248, 24), (88, 216, 84), (88, 248, 152), (0, 232, 216), (120, 120, 120),
        (252, 252, 252), (164, 228, 252), (184, 184, 248), (216, 184, 248), (248, 184, 248), (248, 164, 192), (240, 208, 176),
        (252, 224, 168), (248, 216, 120), (216, 248, 120), (184, 248, 184), (184, 248, 216), (0, 252, 252), (248, 216, 248)
    ],
    "snes": [
        # simplified SNES common palette for demonstration, 
        # normally SNES is 15-bit color. We will use a colorful 16-color palette.
        (0, 0, 0), (34, 34, 34), (85, 85, 85), (136, 136, 136), (187, 187, 187), (255, 255, 255),
        (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255), (0, 255, 255),
        (128, 0, 0), (0, 128, 0), (0, 0, 128), (128, 128, 0)
    ]
}

def apply_palette(image: Image.Image, palette_name: str, colors: int = 16) -> Image.Image:
    if palette_name == "original":
        # Just quantize colors if not original full color
        if colors < 256:
            return image.convert("P", palette=Image.ADAPTIVE, colors=colors).convert("RGB")
        return image
    
    if palette_name not in PALETTES:
        return image
    
    # Map to predefined palette using minimum euclidean distance
    target_palette = PALETTES[palette_name]
    
    # create a flat list for PIL putpalette
    # pad to 256 colors
    flat_palette = []
    for r, g, b in target_palette:
        flat_palette.extend([r, g, b])
    flat_palette.extend([0] * (768 - len(flat_palette)))
    
    # Create an image with this palette
    pal_image = Image.new("P", (1, 1))
    pal_image.putpalette(flat_palette)
    
    # Quantize image to this palette
    return image.quantize(palette=pal_image, dither=Image.Dither.NONE).convert("RGB")


@app.post("/api/pixelate")
async def pixelate_image(
    file: UploadFile = File(...),
    pixel_size: int = Form(10),
    palette: str = Form("original"),
    colors: int = Form(16)
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Original size
        width, height = image.size
        
        # Scale down
        new_width = max(1, width // pixel_size)
        new_height = max(1, height // pixel_size)
        
        small_image = image.resize((new_width, new_height), Image.Resampling.BILINEAR)
        
        # Apply palette / quantize
        small_image = apply_palette(small_image, palette, colors)
        
        # Scale back up using nearest neighbor
        pixelated = small_image.resize((width, height), Image.Resampling.NEAREST)
        
        # Save to buffer
        buf = io.BytesIO()
        pixelated.save(buf, format="PNG")
        buf.seek(0)
        
        return Response(content=buf.getvalue(), media_type="image/png")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
