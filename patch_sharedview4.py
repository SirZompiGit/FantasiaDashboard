import sys
import re

with open('src/components/SharedView.tsx', 'r') as f:
    code = f.read()

# 1. Outer container and canvas width
code = code.replace('w-screen h-screen bg-[#0c0d10]', 'w-full h-full min-h-screen bg-[#0c0d10]')
code = code.replace('className="w-full max-w-[1280px] min-w-[1024px]', 'className="w-full max-w-[95%] xl:max-w-[1600px] min-w-[1024px]')

# 2. Adjust Grid Spans
# Left column (Turn Tracker) -> col-span-3
code = code.replace('col-span-3 bg-bento-panel border border-bento-border', 'col-span-3 bg-bento-panel border border-bento-border')

# Middle column (Health) -> col-span-5
code = code.replace('col-span-4 bg-bento-panel border border-bento-border rounded-xl p-5 md:p-6 shadow-lg h-full flex flex-col overflow-hidden', 'col-span-5 bg-bento-panel border border-bento-border rounded-xl p-5 md:p-6 shadow-lg h-full flex flex-col overflow-hidden')

# Right column (Dice) -> col-span-4
code = code.replace('col-span-5 flex h-full min-h-0 gap-4', 'col-span-4 flex h-full min-h-0 gap-4')

with open('src/components/SharedView.tsx', 'w') as f:
    f.write(code)

