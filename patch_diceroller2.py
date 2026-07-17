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

end_target = "        )}\n      </div>\n    </div>\n  );\n};"
new_end_target = "        )}\n      </div>\n      )}\n    </div>\n  );\n};"

code = code.replace(end_target, new_end_target)

with open('src/components/DiceRoller.tsx', 'w') as f:
    f.write(code)
