import sys
import re

with open('src/components/SharedView.tsx', 'r') as f:
    code = f.read()

# exact string to remove:
target = """                  {diceRollerSlot && (
                    <div className="mb-4 z-10 relative bg-[#0c0d10]/90 border border-slate-700/50 rounded-xl shadow-inner transform scale-90 origin-top flex flex-col -mt-2">
                      {diceRollerSlot}
                    </div>
                  )}"""

code = code.replace(target, "")

# inject before:
# {/* Dice Roll Box (approx 80%) */}

new_dice_roller = """
              {diceRollerSlot && (
                <div className="bg-[#0c0d10] border border-bento-border rounded-xl flex flex-col shadow-lg shrink-0 overflow-hidden relative z-20 h-auto">
                  {diceRollerSlot}
                </div>
              )}
              {/* Dice Roll Box (approx 80%) */}"""

code = code.replace("{/* Dice Roll Box (approx 80%) */}", new_dice_roller)


with open('src/components/SharedView.tsx', 'w') as f:
    f.write(code)

