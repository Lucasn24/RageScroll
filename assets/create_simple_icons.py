#!/usr/bin/env python3
import struct

def create_png(size):
    """Create a simple PNG icon with gradient using raw PNG format"""
    width, height = size, size
    
    # PNG file signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk (image header)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = create_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk (image data)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type
        # Create gradient
        r = int(102 + (118 - 102) * y / height)
        g = int(126 + (75 - 126) * y / height)
        b = int(234 + (162 - 234) * y / height)
        
        for x in range(width):
            raw_data.extend([r, g, b])
    
    import zlib
    compressed_data = zlib.compress(bytes(raw_data), 9)
    idat_chunk = create_chunk(b'IDAT', compressed_data)
    
    # IEND chunk (end of PNG)
    iend_chunk = create_chunk(b'IEND', b'')
    
    return png_signature + ihdr_chunk + idat_chunk + iend_chunk

def create_chunk(chunk_type, data):
    """Create a PNG chunk with CRC"""
    import zlib
    length = struct.pack('>I', len(data))
    crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
    return length + chunk_type + data + crc

# Create icons
for size in [16, 48, 128]:
    with open(f'icon{size}.png', 'wb') as f:
        f.write(create_png(size))
    print(f'Created icon{size}.png')

print('All icons created!')
