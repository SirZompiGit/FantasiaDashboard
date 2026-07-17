import sys
import re

with open('src/components/SharedView.tsx', 'r') as f:
    code = f.read()

# Change Left from 4 to 3
code = code.replace('col-span-4 bg-bento-panel border border-bento-border rounded-xl p-5 md:p-6 shadow-lg h-full flex flex-col overflow-hidden min-h-0', 
                    'col-span-3 bg-bento-panel border border-bento-border rounded-xl p-5 md:p-6 shadow-lg h-full flex flex-col overflow-hidden min-h-0')

# Change Middle from 5 to 4
code = code.replace('col-span-5 bg-bento-panel border border-bento-border rounded-xl p-5 md:p-6 shadow-lg h-full flex flex-col overflow-hidden',
                    'col-span-4 bg-bento-panel border border-bento-border rounded-xl p-5 md:p-6 shadow-lg h-full flex flex-col overflow-hidden')

# Change Right from 3 to 5
code = code.replace('col-span-3 flex flex-col gap-4 h-full min-h-0',
                    'col-span-5 flex h-full min-h-0 gap-4')

# Replace the inner part of Right column
regex = re.compile(r'\{/\* Right Column.*?(?=\{/\* Bottom Area: Notes \*/\})', re.DOTALL)

new_right_col = """            {/* Right Column: Dice Roll, Player Rolls, Schedule (5 cols) */}
            <div className="col-span-5 flex h-full min-h-0 gap-4">
              
              {/* Participant Rolls Sub-Column */}
              {participantRolls && participantRolls.length > 0 && (
                <div className="bg-bento-panel border border-bento-border rounded-xl p-3 shadow-lg flex flex-col flex-[2] overflow-y-auto scrollbar-thin h-full min-w-[140px]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-display block mb-3 sticky top-0 bg-bento-panel z-10 pb-1 border-b border-bento-border/50">
                    Lanci dei Giocatori
                  </span>
                  <div className="flex flex-col gap-3">
                    {participantRolls.slice().reverse().map((roll, idx) => {
                      let playerLabel = roll.label || 'Sconosciuto';
                      let rollLabel = '';
                      if (playerLabel.includes('|')) {
                         const parts = playerLabel.split('|');
                         if (parts.length >= 2) {
                            playerLabel = parts[1] || parts[0];
                            rollLabel = parts.slice(2).join('|');
                         } else {
                            playerLabel = parts[0];
                         }
                      }
                      
                      return (
                        <div key={roll.timestamp + idx} className="bg-[#0c0d10] border border-bento-border rounded-lg p-2 flex flex-col w-full relative overflow-hidden group shadow-md hover:border-slate-700 transition-colors">
                          <div className={`absolute inset-0 bg-radial-gradient ${colors.glow} opacity-0 group-hover:opacity-10 transition-opacity`} />
                          <div className="flex justify-between items-center mb-1 border-b border-bento-border pb-1 gap-1">
                            <span className="text-[10px] text-slate-300 font-mono truncate font-bold" title={playerLabel}>{playerLabel}</span>
                            <span className="text-[9px] text-slate-500 font-bold bg-slate-900 px-1 py-0.5 rounded">{roll.diceType}</span>
                          </div>
                          <div className="flex items-center justify-center py-1 relative">
                            <span className={`text-2xl font-display font-black drop-shadow-sm ${
                              roll.result === parseInt(roll.diceType.substring(1)) ? colors.textActive : roll.result === 1 ? colors.text : 'text-white'
                            }`}>
                              {roll.result}
                            </span>
                            {roll.result === parseInt(roll.diceType.substring(1)) && (
                              <Sparkles className={`w-3 h-3 absolute top-0 right-2 opacity-50 ${colors.textActive}`} />
                            )}
                          </div>
                          {rollLabel && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 text-center truncate w-full block mt-1 bg-slate-800/50 rounded py-0.5 px-1" title={rollLabel}>
                              {rollLabel}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dice Roller & Master Roll Sub-Column */}
              <div className="flex flex-col gap-4 flex-[3] h-full min-h-0">
                {diceRollerSlot && (
                  <div className="bg-[#0c0d10] border border-bento-border rounded-xl flex flex-col shadow-lg shrink-0 overflow-hidden relative z-20 h-auto">
                    {diceRollerSlot}
                  </div>
                )}
                
                {/* Dice Roll Box */}
                <div className="bg-bento-panel border border-bento-border rounded-xl p-3 md:p-4 flex flex-col items-center justify-center text-center relative overflow-hidden flex-1 shadow-lg min-h-0">
                  <div className={`absolute inset-0 bg-radial-gradient ${colors.glow} via-transparent to-transparent opacity-50 pointer-events-none`} />
                  
                  <div className="border-b border-bento-border pb-2 mb-2 w-full">
                      <span className="text-xs uppercase font-mono tracking-widest text-slate-500">Ultimo Lancio</span>
                  </div>
                  
                  {lastRoll ? (
                    <div 
                      className="relative z-10 transition-transform duration-100 flex flex-col items-center flex-1 justify-center w-full"
                      style={{ animation: triggerShake ? 'sharedDiceShake 0.3s ease-in-out' : 'none' }}
                    >
                      <span className="text-slate-500 uppercase tracking-widest font-mono text-xs mb-1 block">
                        Dado {lastRoll.diceType}
                      </span>
                      
                      {lastRoll.label && (
                        <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 bg-[#0c0d10] border border-bento-border text-slate-300 rounded uppercase tracking-wider">
                          {lastRoll.label}
                        </span>
                      )}
                      
                      <div className="relative">
                        <span className={`text-4xl lg:text-5xl font-display font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(${rgbValues},0.35)] block my-2 ${state.isRollHidden ? 'opacity-30 blur-[2px]' : ''}`}>
                          {state.isRollHidden ? '?' : lastRoll.result}
                        </span>
                        {state.isRollHidden && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg lg:text-xl font-mono font-bold text-amber-500 uppercase tracking-widest bg-slate-900/80 px-3 py-1 rounded-lg border border-amber-500/30 rotate-12 drop-shadow-xl backdrop-blur-sm shadow-xl z-20">
                              Nascosto
                            </span>
                          </div>
                        )}
                        
                        {!state.isRollHidden && sparkles.map(p => (
                          <div
                            key={p.id}
                            className="absolute top-1/2 left-1/2 z-50 pointer-events-none"
                            style={{
                              '--ox': `${p.x}px`,
                              '--oy': `${p.y}px`,
                              color: colors.text,
                              animation: 'diceParticleFloatShared 1.5s ease-out forwards'
                            } as React.CSSProperties}
                          >
                            <Sparkles className="w-5 h-5 opacity-80" />
                          </div>
                        ))}
                      </div>

                      {!state.isRollHidden && lastRoll.result === parseInt(lastRoll.diceType.substring(1)) && (
                        <div className={`${colors.text} ${colors.bg}/15 border ${colors.border}/30 font-semibold uppercase tracking-wider text-[10px] font-mono px-3 py-1 rounded-full inline-flex items-center gap-1.5 animate-pulse`}>
                          <Sparkles className="w-3.5 h-3.5" /> CRITICO!
                        </div>
                      )}
                      
                      {!state.isRollHidden && lastRoll.result === 1 && (
                        <div className={`${colors.text} ${colors.bg}/15 border ${colors.border}/30 font-semibold uppercase tracking-wider text-[10px] font-mono px-3 py-1 rounded-full inline-flex items-center gap-1.5`}>
                          FALLIMENTO CRITICO!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center gap-3 flex-1 justify-center">
                      <div className="w-12 h-12 rounded-full border border-dashed border-bento-border flex items-center justify-center">
                        <span className="font-mono text-xs">d20</span>
                      </div>
                      <p className="text-xs italic leading-snug px-4">In attesa del primo lancio...</p>
                    </div>
                  )}

                  {/* Roll History Mini-View */}
                  {state.rollHistory && state.rollHistory.length > 1 && (
                    <div className="mt-2 border-t border-bento-border pt-2 w-full shrink-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-display block mb-2 text-left">
                        Storico
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {state.rollHistory.slice(1).map((roll, idx) => (
                          <div
                            key={roll.timestamp + idx}
                            className="bg-[#0c0d10] border border-bento-border rounded-md py-1 px-2 flex flex-col items-center min-w-[40px] shrink-0"
                          >
                            <span className="text-[8px] text-slate-500 font-mono font-bold">
                              {roll.diceType}
                            </span>
                            <span className={`text-xs font-display font-bold ${
                              roll.result === parseInt(roll.diceType.substring(1))
                                ? `${colors.textActive}`
                                : roll.result === 1
                                ? `${colors.text}`
                                : 'text-slate-300'
                            }`}>
                              {roll.result}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Schedule Box */}
                {(state.scheduleDay || state.scheduleTime) && (
                  <div className="bg-bento-panel border border-bento-border rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-lg shrink-0">
                    <div className="flex items-center gap-3">
                      {state.scheduleDay && (
                        <span className={`text-sm font-display font-bold text-slate-200 capitalize`}>
                          {state.scheduleDay}
                        </span>
                      )}
                      {state.scheduleDay && state.scheduleTime && (
                        <span className={`text-slate-600 font-light`}>|</span>
                      )}
                      {state.scheduleTime && (
                        <span className={`text-sm font-mono font-bold ${colors.text}`}>
                          {state.scheduleTime}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
"""

# Now we need to remove the old Participant Rolls Area from the bottom
bottom_regex = re.compile(r'\{/\* Participant Rolls Area \*/\}.*?(?=\{/\* Bottom Area: Notes \*/\})', re.DOTALL)
new_right_col = new_right_col + "\n"

code = regex.sub(new_right_col, code)
code = bottom_regex.sub("", code)

with open('src/components/SharedView.tsx', 'w') as f:
    f.write(code)

