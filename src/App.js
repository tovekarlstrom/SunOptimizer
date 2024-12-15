import { useState } from "react";
import { useForm } from "react-hook-form";
import generatePrediction from "./components/generatePrediction";
import "./App.css";
import { trainModel } from "./model/predictionModel";

function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [training, setTraining] = useState(null);

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    const prediction = await generatePrediction(data.date);
    const allZero = prediction.every((item) => item.prediction === 0);
    if (allZero) {
      setError(true);
      setData([]);
    } else {
      setError(false);
      setData(prediction);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>SunOptimizer</h1>
      </header>
      <aside>
        <h2>PanelInfo</h2>
        <p>This is the panel information the AI model is trained on!</p>

        <p>Area: 20m2</p>
        <p>Effect: 0.18%</p>
        <p>Tilt: 20m2</p>
        <p>Azimuth: 20m2</p>
        <p>Location: Skövde</p>
      </aside>
      <main>
        <h2>Predict the amount of energy generated from your solar panels</h2>
        <p>
          Please note that this model only provides an estimate and cannot
          guarantee exact results.
        </p>
        <p>
          The model is based on historical data and may be influenced by many
          factors not included in the training data.
        </p>
        <p>
          We recommend using the results as a guideline and supplementing them
          with additional sources and expert opinions.
        </p>
        <button
          style={{
            width: "200px",
            height: "50px",
            borderStyle: "none",
            backgroundColor: "darkGreen",
            color: "white",
            fontSize: "20px",
            fontWeight: "bold",
            borderRadius: "10px",
          }}
          disabled={training}
          onClick={async () => {
            setTraining(true);
            setTraining(await trainModel());
            console.log("Initiating training");
          }}
        >
          Train Model
        </button>
        {training !== null ? (
          training ? (
            <p>Training model...</p>
          ) : (
            <form id="predictionForm" onSubmit={handleSubmit(onSubmit)}>
              <label htmlFor="date">Insert your timespan</label>
              <input id="date" type="date" name="date" {...register("date")} />
              <button type="submit">Generate prediction</button>
            </form>
          )
        ) : null}
        {data.length > 0 || !error ? (
          <div>
            <h3>Results</h3>
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Energy</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index}>
                      <td>{item.time}</td>
                      <td
                        style={{
                          backgroundColor:
                            item.prediction === 0 ? "red" : "green",
                        }}
                      >
                        {item.prediction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p>An error accourd training the model, please try again.</p>
        )}
      </main>
      <footer>
        <p>By: Tove Karlström</p>
      </footer>
    </div>
  );
}

export default App;
