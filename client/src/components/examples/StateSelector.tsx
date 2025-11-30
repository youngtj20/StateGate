import StateSelector from "../StateSelector";

export default function StateSelectorExample() {
  return (
    <div className="p-8 bg-background min-h-[400px] flex items-center justify-center">
      <StateSelector 
        onStateSelect={(state) => console.log("Selected state:", state.name)}
      />
    </div>
  );
}
