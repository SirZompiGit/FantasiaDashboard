import sys

with open('src/components/SharedView.tsx', 'r') as f:
    code = f.read()

code = code.replace('w-full h-full min-h-screen bg-[#0c0d10]', 'w-full h-full min-h-full bg-[#0c0d10]')

with open('src/components/SharedView.tsx', 'w') as f:
    f.write(code)

