import { createIcons, BookOpen, BookmarkCheck, Box, Brain, CheckCircle2, ChevronDown, ChevronRight, ChevronsUp, CircleDot, CloudLightning, Crosshair, Dices, Droplets, Flame, FoldVertical, HeartPulse, History, MoveRight, Pencil, Play, Redo2, RotateCcw, Save, ScrollText, Shield, ShieldAlert, ShoppingBag, Skull, Snowflake, Sparkles, Sun, Swords, Target, Triangle, Undo2, UnfoldVertical, UserCheck, UserPlus, Wand2, Zap } from "lucide";

// Somente os ícones usados na ficha; adicionar aqui ao introduzir outro nome.
// A ponte mantém os cartões existentes funcionando durante a migração por módulos.
const icons = { BookOpen, BookmarkCheck, Box, Brain, CheckCircle2, ChevronDown, ChevronRight, ChevronsUp, CircleDot, CloudLightning, Crosshair, Dices, Droplets, Flame, FoldVertical, HeartPulse, History, MoveRight, Pencil, Play, Redo2, RotateCcw, Save, ScrollText, Shield, ShieldAlert, ShoppingBag, Skull, Snowflake, Sparkles, Sun, Swords, Target, Triangle, Undo2, UnfoldVertical, UserCheck, UserPlus, Wand2, Zap };
Object.assign(window, { lucide: { createIcons: () => createIcons({ icons }) } });
