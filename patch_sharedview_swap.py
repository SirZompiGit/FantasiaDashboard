import sys
import re

with open('src/components/SharedView.tsx', 'r') as f:
    code = f.read()

# Extract the two sub-columns
regex = re.compile(r'(\{\/\* Participant Rolls Sub-Column \*\/\}.*?)(\{\/\* Dice Roller & Master Roll Sub-Column \*\/\}.*?)(?=\{\/\* Bottom Area: Notes \*\/\})', re.DOTALL)

def swap(match):
    participant = match.group(1)
    dice_roller = match.group(2)
    return dice_roller + "\n              " + participant

code = regex.sub(swap, code)

with open('src/components/SharedView.tsx', 'w') as f:
    f.write(code)

