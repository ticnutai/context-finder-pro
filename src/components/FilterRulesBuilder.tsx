import { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  MapPin, 
  Plus, 
  X, 
  Filter, 
  AlignRight, 
  AlignLeft, 
  Hash, 
  Type, 
  Ruler,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Target,
  Shuffle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FilterRules, PositionRule, TextPositionRule, PositionType, TextPosition } from '@/types/search';

interface FilterRulesBuilderProps {
  rules: FilterRules;
  onRulesChange: (rules: FilterRules) => void;
}

const positionConfig = {
  before: { label: 'לפני', icon: ArrowRight, color: 'bg-blue-500', description: 'המילה חייבת להופיע לפני' },
  after: { label: 'אחרי', icon: ArrowLeft, color: 'bg-green-500', description: 'המילה חייבת להופיע אחרי' },
  anywhere: { label: 'בכל מקום', icon: Shuffle, color: 'bg-purple-500', description: 'המילה יכולה להופיע בכל מקום' },
};

const textPositionConfig = {
  start: { label: 'בתחילת השורה', icon: AlignRight, color: 'bg-gold', description: 'המילה חייבת להיות בתחילה' },
  end: { label: 'בסוף השורה', icon: AlignLeft, color: 'bg-navy', description: 'המילה חייבת להיות בסוף' },
  anywhere: { label: 'בכל מקום', icon: MapPin, color: 'bg-gray-500', description: 'המילה יכולה להופיע בכל מקום' },
};

export function FilterRulesBuilder({ rules, onRulesChange }: FilterRulesBuilderProps) {
  const [positionRulesOpen, setPositionRulesOpen] = useState(true);
  const [textPositionOpen, setTextPositionOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // Position Rules (before/after)
  const addPositionRule = () => {
    const newRule: PositionRule = {
      id: crypto.randomUUID(),
      word: '',
      relativeWord: '',
      position: 'before',
      maxDistance: 10,
    };
    onRulesChange({
      ...rules,
      positionRules: [...rules.positionRules, newRule],
    });
  };

  const updatePositionRule = (id: string, updates: Partial<PositionRule>) => {
    onRulesChange({
      ...rules,
      positionRules: rules.positionRules.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  const removePositionRule = (id: string) => {
    onRulesChange({
      ...rules,
      positionRules: rules.positionRules.filter(r => r.id !== id),
    });
  };

  // Text Position Rules (start/end)
  const addTextPositionRule = () => {
    const newRule: TextPositionRule = {
      id: crypto.randomUUID(),
      word: '',
      position: 'start',
      withinWords: 3,
    };
    onRulesChange({
      ...rules,
      textPositionRules: [...rules.textPositionRules, newRule],
    });
  };

  const updateTextPositionRule = (id: string, updates: Partial<TextPositionRule>) => {
    onRulesChange({
      ...rules,
      textPositionRules: rules.textPositionRules.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  const removeTextPositionRule = (id: string) => {
    onRulesChange({
      ...rules,
      textPositionRules: rules.textPositionRules.filter(r => r.id !== id),
    });
  };

  const activeRulesCount = 
    rules.positionRules.filter(r => r.word && r.relativeWord).length +
    rules.textPositionRules.filter(r => r.word).length +
    (rules.minWordCount ? 1 : 0) +
    (rules.maxWordCount ? 1 : 0) +
    (rules.mustContainNumbers ? 1 : 0) +
    (rules.mustContainLettersOnly ? 1 : 0);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="glass-effect rounded-2xl p-6 space-y-6 animate-fade-in" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center shadow-lg">
              <Filter className="w-6 h-6 text-navy" />
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-navy">כללי סינון מתקדמים</h2>
              <p className="text-sm text-muted-foreground">
                {activeRulesCount > 0 ? `${activeRulesCount} כללים פעילים` : 'הגדר כללים לחיפוש מדויק יותר'}
              </p>
            </div>
          </div>
          
          {activeRulesCount > 0 && (
            <Badge className="bg-gold text-navy font-semibold px-4 py-2 rounded-xl">
              <Sparkles className="w-4 h-4 ml-2" />
              {activeRulesCount} כללים
            </Badge>
          )}
        </div>

        {/* Section 1: Position Rules (Before/After) */}
        <Collapsible open={positionRulesOpen} onOpenChange={setPositionRulesOpen}>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl border-2 border-blue-200/50 overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-lg text-navy flex items-center gap-2">
                      מיקום יחסי
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-navy text-white p-4 rounded-xl max-w-sm text-right">
                          <div className="font-bold mb-2">מילה לפני/אחרי מילה אחרת</div>
                          <div className="text-sm opacity-90">
                            הגדר שמילה חייבת להופיע לפני או אחרי מילה אחרת בטקסט
                          </div>
                          <div className="mt-2 text-xs bg-white/20 p-2 rounded-lg">
                            דוגמה: "משה" חייב להופיע לפני "רבינו"
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      הגדר מילים שחייבות להופיע לפני או אחרי מילים אחרות
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rules.positionRules.length > 0 && (
                    <Badge variant="secondary" className="bg-white text-navy rounded-lg">
                      {rules.positionRules.length} כללים
                    </Badge>
                  )}
                  <ChevronDown className={`w-5 h-5 text-navy transition-transform duration-200 ${positionRulesOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-5 pt-0 space-y-4">
                {rules.positionRules.map((rule, index) => (
                  <div 
                    key={rule.id} 
                    className="bg-white rounded-xl p-5 border-2 border-border/50 shadow-sm hover:shadow-md transition-all animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <Badge className="bg-navy text-white font-semibold px-3 py-1 rounded-lg whitespace-nowrap">
                        כלל {index + 1}
                      </Badge>
                      
                      <div className="flex-1 space-y-4">
                        {/* Row 1: Word and Position */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-navy flex items-center gap-2">
                              <Type className="w-4 h-4 text-gold" />
                              המילה שאחפש
                            </Label>
                            <Input
                              value={rule.word}
                              onChange={(e) => updatePositionRule(rule.id, { word: e.target.value })}
                              placeholder='לדוגמה: "משה"'
                              className="text-right rounded-xl border-2 border-navy/20 focus:border-gold h-12 text-base"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-navy flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gold" />
                              חייבת להיות
                            </Label>
                            <Select
                              value={rule.position}
                              onValueChange={(value: PositionType) => updatePositionRule(rule.id, { position: value })}
                            >
                              <SelectTrigger className="rounded-xl border-2 border-navy/20 focus:border-gold h-12">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white rounded-xl border-2 border-navy/20">
                                {Object.entries(positionConfig).map(([key, config]) => {
                                  const Icon = config.icon;
                                  return (
                                    <SelectItem key={key} value={key} className="rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 ${config.color} rounded-md flex items-center justify-center`}>
                                          <Icon className="w-3 h-3 text-white" />
                                        </div>
                                        <span>{config.label}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-navy flex items-center gap-2">
                              <Type className="w-4 h-4 text-gold" />
                              המילה השנייה
                            </Label>
                            <Input
                              value={rule.relativeWord}
                              onChange={(e) => updatePositionRule(rule.id, { relativeWord: e.target.value })}
                              placeholder='לדוגמה: "רבינו"'
                              className="text-right rounded-xl border-2 border-navy/20 focus:border-gold h-12 text-base"
                            />
                          </div>
                        </div>
                        
                        {/* Row 2: Distance */}
                        {rule.position !== 'anywhere' && (
                          <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                            <Ruler className="w-5 h-5 text-navy" />
                            <Label className="text-sm font-medium text-navy whitespace-nowrap">מרחק מקסימלי:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={rule.maxDistance || 10}
                              onChange={(e) => updatePositionRule(rule.id, { maxDistance: parseInt(e.target.value) || 10 })}
                              className="w-20 text-center rounded-xl border-2 border-navy/20 h-10"
                            />
                            <span className="text-sm text-muted-foreground">מילים</span>
                          </div>
                        )}
                        
                        {/* Preview */}
                        {rule.word && rule.relativeWord && (
                          <div className="flex items-center gap-2 p-3 bg-gold/10 border border-gold/30 rounded-xl">
                            <Sparkles className="w-4 h-4 text-gold" />
                            <span className="text-sm text-navy font-medium">
                              תצוגה מקדימה:{' '}
                              {rule.position === 'before' 
                                ? `"${rule.word}" חייבת להופיע לפני "${rule.relativeWord}" (עד ${rule.maxDistance} מילים)`
                                : rule.position === 'after'
                                ? `"${rule.word}" חייבת להופיע אחרי "${rule.relativeWord}" (עד ${rule.maxDistance} מילים)`
                                : `"${rule.word}" יכולה להיות בכל מקום ביחס ל"${rule.relativeWord}"`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePositionRule(rule.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  onClick={addPositionRule}
                  variant="outline"
                  className="w-full h-14 gap-3 rounded-xl border-2 border-dashed border-navy/30 hover:border-gold hover:bg-gold/5 text-navy font-semibold transition-all"
                >
                  <Plus className="w-5 h-5" />
                  הוסף כלל מיקום יחסי
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 2: Text Position Rules (Start/End) */}
        <Collapsible open={textPositionOpen} onOpenChange={setTextPositionOpen}>
          <div className="bg-gradient-to-br from-gold/10 to-navy/5 rounded-2xl border-2 border-gold/30 overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold to-navy rounded-xl flex items-center justify-center shadow-md">
                    <AlignRight className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-lg text-navy flex items-center gap-2">
                      מיקום בשורה
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-navy text-white p-4 rounded-xl max-w-sm text-right">
                          <div className="font-bold mb-2">מילה בתחילת/סוף שורה</div>
                          <div className="text-sm opacity-90">
                            הגדר שמילה חייבת להופיע בתחילת השורה או בסופה
                          </div>
                          <div className="mt-2 text-xs bg-white/20 p-2 rounded-lg">
                            דוגמה: "אמר" חייב להופיע בתחילת השורה
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      הגדר מילים שחייבות להופיע בתחילת או בסוף השורה
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rules.textPositionRules.length > 0 && (
                    <Badge variant="secondary" className="bg-white text-navy rounded-lg">
                      {rules.textPositionRules.length} כללים
                    </Badge>
                  )}
                  <ChevronDown className={`w-5 h-5 text-navy transition-transform duration-200 ${textPositionOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-5 pt-0 space-y-4">
                {rules.textPositionRules.map((rule, index) => (
                  <div 
                    key={rule.id} 
                    className="bg-white rounded-xl p-5 border-2 border-border/50 shadow-sm hover:shadow-md transition-all animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <Badge className="bg-gold text-navy font-semibold px-3 py-1 rounded-lg whitespace-nowrap">
                        כלל {index + 1}
                      </Badge>
                      
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-navy flex items-center gap-2">
                              <Type className="w-4 h-4 text-gold" />
                              המילה
                            </Label>
                            <Input
                              value={rule.word}
                              onChange={(e) => updateTextPositionRule(rule.id, { word: e.target.value })}
                              placeholder='לדוגמה: "אמר"'
                              className="text-right rounded-xl border-2 border-navy/20 focus:border-gold h-12 text-base"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-navy flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gold" />
                              מיקום בשורה
                            </Label>
                            <Select
                              value={rule.position}
                              onValueChange={(value: TextPosition) => updateTextPositionRule(rule.id, { position: value })}
                            >
                              <SelectTrigger className="rounded-xl border-2 border-navy/20 focus:border-gold h-12">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white rounded-xl border-2 border-navy/20">
                                {Object.entries(textPositionConfig).map(([key, config]) => {
                                  const Icon = config.icon;
                                  return (
                                    <SelectItem key={key} value={key} className="rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 ${config.color} rounded-md flex items-center justify-center`}>
                                          <Icon className="w-3 h-3 text-white" />
                                        </div>
                                        <span>{config.label}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {rule.position !== 'anywhere' && (
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-navy flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-gold" />
                                תוך כמה מילים
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                value={rule.withinWords || 3}
                                onChange={(e) => updateTextPositionRule(rule.id, { withinWords: parseInt(e.target.value) || 3 })}
                                className="text-center rounded-xl border-2 border-navy/20 focus:border-gold h-12"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Preview */}
                        {rule.word && (
                          <div className="flex items-center gap-2 p-3 bg-gold/10 border border-gold/30 rounded-xl">
                            <Sparkles className="w-4 h-4 text-gold" />
                            <span className="text-sm text-navy font-medium">
                              תצוגה מקדימה:{' '}
                              {rule.position === 'start' 
                                ? `"${rule.word}" חייבת להופיע בתוך ${rule.withinWords} המילים הראשונות`
                                : rule.position === 'end'
                                ? `"${rule.word}" חייבת להופיע בתוך ${rule.withinWords} המילים האחרונות`
                                : `"${rule.word}" יכולה להיות בכל מקום בשורה`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTextPositionRule(rule.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  onClick={addTextPositionRule}
                  variant="outline"
                  className="w-full h-14 gap-3 rounded-xl border-2 border-dashed border-gold/30 hover:border-gold hover:bg-gold/5 text-navy font-semibold transition-all"
                >
                  <Plus className="w-5 h-5" />
                  הוסף כלל מיקום בשורה
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 3: Advanced Filters */}
        <Collapsible open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200/50 overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                    <Hash className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-lg text-navy">סינונים נוספים</h3>
                    <p className="text-sm text-muted-foreground">
                      אורך טקסט, מספרים, ועוד
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-navy transition-transform duration-200 ${advancedFiltersOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-5 pt-0 space-y-4">
                {/* Word Count */}
                <div className="bg-white rounded-xl p-5 border-2 border-border/50 shadow-sm">
                  <Label className="text-sm font-semibold text-navy flex items-center gap-2 mb-4">
                    <Ruler className="w-4 h-4 text-purple-500" />
                    טווח אורך שורה (במילים)
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">מינימום</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="ללא הגבלה"
                        value={rules.minWordCount || ''}
                        onChange={(e) => onRulesChange({ ...rules, minWordCount: parseInt(e.target.value) || undefined })}
                        className="rounded-xl border-2 border-purple-200 focus:border-purple-500 h-12 text-center"
                      />
                    </div>
                    <span className="text-muted-foreground font-semibold mt-6">—</span>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">מקסימום</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="ללא הגבלה"
                        value={rules.maxWordCount || ''}
                        onChange={(e) => onRulesChange({ ...rules, maxWordCount: parseInt(e.target.value) || undefined })}
                        className="rounded-xl border-2 border-purple-200 focus:border-purple-500 h-12 text-center"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Toggle Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
                      rules.mustContainNumbers 
                        ? 'bg-white border-2 border-purple-500 shadow-sm' 
                        : 'bg-white/50 border-2 border-transparent hover:border-purple-200'
                    }`}
                    onClick={() => onRulesChange({ ...rules, mustContainNumbers: !rules.mustContainNumbers })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rules.mustContainNumbers ? 'bg-purple-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                        <Hash className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <Label className="font-medium">חייב לכלול מספרים</Label>
                        <p className="text-xs text-muted-foreground">רק שורות עם מספרים</p>
                      </div>
                    </div>
                    <Switch
                      checked={rules.mustContainNumbers}
                      onCheckedChange={(checked) => onRulesChange({ ...rules, mustContainNumbers: checked })}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <div 
                    className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
                      rules.mustContainLettersOnly 
                        ? 'bg-white border-2 border-purple-500 shadow-sm' 
                        : 'bg-white/50 border-2 border-transparent hover:border-purple-200'
                    }`}
                    onClick={() => onRulesChange({ ...rules, mustContainLettersOnly: !rules.mustContainLettersOnly })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rules.mustContainLettersOnly ? 'bg-purple-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                        <Type className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <Label className="font-medium">אותיות בלבד</Label>
                        <p className="text-xs text-muted-foreground">ללא מספרים או סימנים</p>
                      </div>
                    </div>
                    <Switch
                      checked={rules.mustContainLettersOnly}
                      onCheckedChange={(checked) => onRulesChange({ ...rules, mustContainLettersOnly: checked })}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </TooltipProvider>
  );
}
