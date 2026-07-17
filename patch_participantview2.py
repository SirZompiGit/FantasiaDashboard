import sys
import re

with open('src/components/ParticipantView.tsx', 'r') as f:
    code = f.read()

target = "lastRoll={myLastRoll}\n                rollHistory={myRollHistory}"
new_target = "lastRoll={myLastRoll}\n                rollHistory={myRollHistory}\n                hideHistory={true}"

code = code.replace(target, new_target)

with open('src/components/ParticipantView.tsx', 'w') as f:
    f.write(code)
