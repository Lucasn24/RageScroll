#!/usr/bin/env python3
from PIL import Image, ImageDraw

# Create gradient icons
sizes = [16, 48, 128]

for size in sizes:
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background
    for y in range(size):
        r = int(102 + (118 - 102) * y / size)
        g = int(126 + (75 - 126) * y / size)
        b = int(234 + (162 - 234) * y / size)
        draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b))
    
    # Draw simple shapes for larger icons
    if size >= 48:
        body_width = int(size * 0.7)
        body_height = int(size * 0.5)
        x_offset = (size - body_width) // 2
        y_offset = (size - body_height) // 2
        
        draw.rounded_rectangle(
            [(x_offset, y_offset), (x_offset + body_width, y_offset + body_height)],
            radius=size//8,
            fill='white'
        )
        
        # D-pad
        dpad_size = size // 8
        dpad_x = x_offset + size // 6
        dpad_y = y_offset + body_height // 2 - dpad_size // 2
        
        draw.rectangle(
            [(dpad_x - dpad_size//2, dpad_y), (dpad_x + dpad_size//2, dpad_y + dpad_size)],
            fill=(102, 126, 234)
        )
        draw.rectangle(
            [(dpad_x - dpad_size, dpad_y + dpad_size//2 - dpad_size//4), 
             (dpad_x + dpad_size, dpad_y + dpad_size//2 + dpad_size//4)],
            fill=(102, 126, 234)
        )
        
        # Buttons
        btn_size = size // 12
        btn_x = x_offset + body_width - size // 5
        btn_y = y_offset + body_height // 2
        
        draw.ellipse(
            [(btn_x - btn_size, btn_y - btn_size), (btn_x + btn_size, btn_y + btn_size)],
            fill=(102, 126, 234)
        )
    
    img.save(f'icon{size}.png', 'PNG')
    print(f'Created icon{size}.png')

print('All icons created!')
