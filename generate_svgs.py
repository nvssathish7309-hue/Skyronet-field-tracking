import base64

with open('frontend/public/logo-transparent-darktext.png', 'rb') as f:
    full_data = base64.b64encode(f.read()).decode('utf-8')

with open('frontend/public/logo-icon.png', 'rb') as f:
    icon_data = base64.b64encode(f.read()).decode('utf-8')

full_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 776 198" width="100%" height="100%">
  <image href="data:image/png;base64,{full_data}" x="0" y="0" width="776" height="198" />
</svg>'''

icon_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 177 130" width="100%" height="100%">
  <image href="data:image/png;base64,{icon_data}" x="0" y="0" width="177" height="130" />
</svg>'''

with open('frontend/public/logo.svg', 'w') as f:
    f.write(full_svg)

with open('frontend/public/logo-icon.svg', 'w') as f:
    f.write(icon_svg)

print("SVG files generated successfully!")
