export default function GarminHowTo({ downloadLabel = "the download arrow" }: { downloadLabel?: string }) {
  return (
    <div className="garmin-howto">
      <p>
        <strong>Get this on a Garmin.</strong> Use {downloadLabel}, copy the .fit file into GARMIN/NewFiles with the official cable, then unplug. The workout stays on the watch. It will not appear in Garmin Connect.
      </p>
      <p>
        <strong>Start it on the watch.</strong> Press START, choose Run, then UP → Training → Workouts. Open your run, choose START → Do Workout, then press START again to begin.
      </p>
    </div>
  );
}
