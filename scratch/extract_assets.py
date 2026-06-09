import os
from PIL import Image

image_path = r"C:\Users\edgar\.gemini\antigravity\brain\5b96343a-763f-4072-b19a-66f9f062437b\media__1780428180872.jpg"

def make_transparent_smooth(img):
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        # Average color or maximum color value
        val = max(r, g, b)
        if val > 254:
            new_data.append((r, g, b, 0))
        elif val > 240:
            # Smooth transition for anti-aliasing
            alpha = int((255 - val) / (255 - 240) * 255)
            # Make sure alpha is between 0 and 255
            alpha = max(0, min(255, alpha))
            new_data.append((r, g, b, alpha))
        else:
            new_data.append((r, g, b, 255))
    img.putdata(new_data)
    return img

with Image.open(image_path) as img:
    # 1. Full logo crop
    # X: 135 to 855 (width 720), Y: 441 to 587 (height 146)
    # Let's crop with padding: left=110, right=880, top=420, bottom=610
    logo_crop = img.crop((110, 420, 880, 610))
    logo_transparent = make_transparent_smooth(logo_crop)
    
    # Save full logo to public/logo.png
    public_logo_path = r"c:\Users\edgar\Documents\Borarly\public\logo.png"
    logo_transparent.save(public_logo_path, "PNG")
    print(f"Saved full logo to: {public_logo_path}")

    # 2. Mark (favicon) crop
    # Mark is Segment 1: X: 135 to 310, Y: 441 to 587. Center: X=222.5, Y=514
    # Take a square crop centered on the mark. Let's use 166x166 square.
    # Center X=222, Y=514. Half-size = 83.
    # left = 222 - 83 = 139
    # right = 222 + 83 = 305
    # top = 514 - 83 = 431
    # bottom = 514 + 83 = 597
    mark_crop = img.crop((130, 431, 310, 597))  # 180x166 rectangle, let's adjust for square:
    # Let's do 180x180 square:
    # Center X=222, Y=514. Half-size = 90.
    # left = 222 - 90 = 132
    # right = 222 + 90 = 312
    # top = 514 - 90 = 424
    # bottom = 514 + 90 = 604
    mark_crop = img.crop((132, 424, 312, 604))
    mark_transparent = make_transparent_smooth(mark_crop)
    
    # Save favicon files
    favicon_ico_path = r"c:\Users\edgar\Documents\Borarly\src\app\favicon.ico"
    icon_192_path = r"c:\Users\edgar\Documents\Borarly\public\icon-192.png"
    icon_512_path = r"c:\Users\edgar\Documents\Borarly\public\icon-512.png"
    
    # Convert and save as ICO
    mark_transparent.resize((32, 32)).save(favicon_ico_path, format="ICO")
    mark_transparent.resize((192, 192)).save(icon_192_path, "PNG")
    mark_transparent.resize((512, 512)).save(icon_512_path, "PNG")
    
    print("Saved all favicon/icon files successfully!")
