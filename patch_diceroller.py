import sys
import re

with open('src/components/DiceRoller.tsx', 'r') as f:
    code = f.read()

# Add hideHistory to props
code = code.replace("theme?: CampaignTheme;", "theme?: CampaignTheme;\n  hideHistory?: boolean;")
code = code.replace("onSelectedDiceChange,", "onSelectedDiceChange,\n  hideHistory = false,")

# Wrap history section
history_section = r'\{\/\* History of Rolls \*\/\}\s*<div className="mt-6 border-t border-bento-border pt-4">'
new_history_section = "{/* History of Rolls */}\n      {!hideHistory && (\n      <div className=\"mt-6 border-t border-bento-border pt-4\">"

code = re.sub(history_section, new_history_section, code)

# We need to close the !hideHistory condition. The history section ends with the return statement.
# Wait, let's look at the end of the DiceRoller component.
