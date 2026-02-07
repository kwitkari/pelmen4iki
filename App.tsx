import React, { useState, useMemo, useEffect } from 'react';
import DoughCanvas from './components/DoughCanvas';
import { Point, Circle, AppMode, DoughStats } from './types';
import { optimizeCircles, calculatePolygonArea } from './utils/geometry';
import { fetchPelmeniRecipe } from './services/geminiService';
import { 
  CalculatorIcon, 
  TrashIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface RecipeData {
  fillingWeightGrams?: number;
  flourWeightGrams?: number;
  chefTip?: string;
  error?: string;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DRAWING);
  const [points, setPoints] = useState<Point[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [pelmeniDiameter, setPelmeniDiameter] = useState<number>(35); // mm, visual scale adjusted
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  // Conversion: 1 pixel on screen = 1mm (conceptually, for simplicity)
  const radius = pelmeniDiameter / 2;

  const handleAddPoint = (p: Point) => {
    setPoints([...points, p]);
  };

  const handleClosePolygon = () => {
    setMode(AppMode.CLOSED);
  };

  const handleClear = () => {
    setPoints([]);
    setCircles([]);
    setMode(AppMode.DRAWING);
    setRecipe(null);
  };

  const handleOptimize = () => {
    if (points.length < 3) return;
    setMode(AppMode.OPTIMIZING);
    
    // Defer to next tick to allow UI to update
    setTimeout(() => {
      const result = optimizeCircles(points, radius, 2); // 2mm gap
      setCircles(result);
      setMode(AppMode.DONE);
    }, 100);
  };

  const handleGetRecipe = async () => {
    if (circles.length === 0) return;
    setLoadingRecipe(true);
    try {
      const jsonStr = await fetchPelmeniRecipe(circles.length, pelmeniDiameter);
      const data = JSON.parse(jsonStr);
      setRecipe(data);
    } catch (e) {
      console.error(e);
      setRecipe({ error: "Could not retrieve recipe." });
    } finally {
      setLoadingRecipe(false);
    }
  };

  const stats: DoughStats = useMemo(() => {
    if (points.length < 3) return { area: 0, pelmeniCount: 0, efficiency: 0 };
    const area = calculatePolygonArea(points);
    const circleArea = Math.PI * radius * radius * circles.length;
    return {
      area,
      pelmeniCount: circles.length,
      efficiency: area > 0 ? (circleArea / area) * 100 : 0
    };
  }, [points, circles, radius]);

  return (
    <div className="flex h-screen w-full bg-stone-100 font-sans text-stone-800">
      
      {/* Sidebar Controls */}
      <aside className="w-80 bg-white border-r border-stone-200 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-stone-100">
          <h1 className="text-2xl font-black tracking-tight text-amber-600 flex items-center gap-2">
            <span className="text-3xl">🥟</span> Pelmeni.ai
          </h1>
          <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">Topology Optimizer</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Settings Section */}
          <section>
            <h2 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
              Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Pelmeni Size (Diameter)</label>
                <div className="flex items-center gap-3">
                   <input 
                    type="range" 
                    min="20" 
                    max="80" 
                    value={pelmeniDiameter}
                    onChange={(e) => setPelmeniDiameter(Number(e.target.value))}
                    disabled={mode === AppMode.DONE}
                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-sm font-mono font-bold w-12 text-right">{pelmeniDiameter}mm</span>
                </div>
              </div>
            </div>
          </section>

          {/* Actions Section */}
          <section>
            <h2 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
              Actions
            </h2>
            <div className="grid grid-cols-1 gap-3">
               {mode === AppMode.DRAWING && (
                 <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100">
                   Draw the dough shape on the canvas.
                 </div>
               )}
               
               {mode === AppMode.CLOSED && (
                 <button
                   onClick={handleOptimize}
                   className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                 >
                   <CalculatorIcon className="w-5 h-5" />
                   Optimize Topology
                 </button>
               )}

               {mode === AppMode.DONE && (
                  <div className="space-y-3">
                    <button
                      onClick={handleGetRecipe}
                      disabled={loadingRecipe || !!recipe}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md"
                    >
                      {loadingRecipe ? (
                         <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                         <SparklesIcon className="w-5 h-5" />
                      )}
                      {recipe ? 'Recipe Loaded' : 'Calculate Ingredients'}
                    </button>
                    
                    <button
                      onClick={handleClear}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-stone-200 hover:border-stone-300 text-stone-600 font-bold rounded-xl transition-all"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                      Reset / New Dough
                    </button>
                  </div>
               )}

               {mode !== AppMode.DONE && mode !== AppMode.CLOSED && points.length > 0 && (
                 <button
                    onClick={handleClear}
                    className="flex items-center justify-center gap-2 w-full py-2 text-stone-400 hover:text-red-500 text-sm font-medium transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Clear Canvas
                  </button>
               )}
            </div>
          </section>

          {/* Stats Section */}
          {mode === AppMode.DONE && (
            <section className="animate-fade-in">
               <h2 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
                Production Stats
              </h2>
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-stone-500 text-sm">Output</span>
                    <span className="text-2xl font-black text-amber-600">{stats.pelmeniCount} <span className="text-xs font-normal text-stone-400">pcs</span></span>
                 </div>
                 <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.efficiency}%` }}></div>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-400">Dough Efficiency</span>
                    <span className="font-bold text-emerald-600">{stats.efficiency.toFixed(1)}%</span>
                 </div>
              </div>
            </section>
          )}

          {/* Recipe Card */}
          {recipe && (
             <section className="animate-fade-in-up">
               <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <ShoppingBagIcon className="w-8 h-8 text-emerald-200" />
                  </div>
                  <h3 className="font-bold text-emerald-800 mb-3">Shopping List</h3>
                  <ul className="space-y-2 text-sm text-stone-600 mb-4">
                     <li className="flex justify-between border-b border-stone-50 pb-1">
                        <span>Flour Type 00</span>
                        <span className="font-mono font-bold text-stone-800">{recipe.flourWeightGrams}g</span>
                     </li>
                     <li className="flex justify-between border-b border-stone-50 pb-1">
                        <span>Minced Meat</span>
                        <span className="font-mono font-bold text-stone-800">{recipe.fillingWeightGrams}g</span>
                     </li>
                  </ul>
                  <div className="bg-emerald-50 p-3 rounded-lg text-xs text-emerald-800 italic">
                    "{recipe.chefTip}"
                  </div>
               </div>
             </section>
          )}

        </div>
        
        <div className="p-4 text-center border-t border-stone-100 text-[10px] text-stone-400">
           Pelmeni Optimizer v1.0 &bull; Powered by Gemini
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 p-6 flex flex-col relative">
        <div className="flex-1 relative">
           <DoughCanvas 
             points={points} 
             circles={circles} 
             mode={mode} 
             onAddPoint={handleAddPoint}
             onClosePolygon={handleClosePolygon}
             circleRadius={radius}
           />
           
           {mode === AppMode.OPTIMIZING && (
             <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
                   <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                   <p className="font-bold text-stone-700">Optimizing Topology...</p>
                   <p className="text-xs text-stone-500">Calculating maximum density</p>
                </div>
             </div>
           )}
        </div>
      </main>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
