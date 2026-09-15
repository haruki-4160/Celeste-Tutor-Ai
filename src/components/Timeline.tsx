import { CheckCircle2, AlertTriangle } from 'lucide-react';
export default function Timeline({ steps = [] }: { steps: any[] }) {
  if (steps.length === 0) return <div className="bg-white p-6 rounded-xl border shadow-sm h-full flex items-center justify-center text-gray-400">Submit working to see timeline.</div>;
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm h-full">
      <h2 className="text-sm font-semibold text-gray-700 uppercase mb-6">Reasoning Timeline</h2>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {steps.map((step, index) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              {step.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow">
              <span className="font-mono text-sm font-semibold text-slate-800">Step {step.stepNumber}</span>
              <p className="text-slate-700 font-mono text-sm">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
