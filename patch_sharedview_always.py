import sys
import re

with open('src/components/SharedView.tsx', 'r') as f:
    code = f.read()

# Make the Participant Rolls Sub-Column always present
target = "{participantRolls && participantRolls.length > 0 && ("
new_target = "{"

# We must be careful not to break the JSX
# Let's use regex to replace that specific line under {/* Participant Rolls Sub-Column */}
regex = re.compile(r'\{\/\* Participant Rolls Sub-Column \*\/\}\s*\{participantRolls && participantRolls\.length > 0 && \(')
new_code = "{/* Participant Rolls Sub-Column */}\n              {("

code = regex.sub(new_code, code)

# And wait, the end of that block has `)}` which will now just be `)}` closing the `{( ... )}` we just created, but since we removed the condition it would be `{( <div...> ... </div> )}`. 
# Wait, let's just remove the condition cleanly.
