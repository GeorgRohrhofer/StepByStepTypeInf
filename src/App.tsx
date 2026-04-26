import './App.css'
import { infereType } from './inference-engine/inference';
import { replaceParamWithType } from './inference-engine/type-replace';
import { parseTerm, getTerm } from './lambda-parser/parser'
import type { Type } from './shared/types';

function App() {
    return (
        <main className="app">
            <h1>Step by Step Type Inference</h1>
            <form className="type-input" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter lambda term, e.g. (\x. x)"
                    aria-label="Lambda term"
                />
                <button type="submit">Submit</button>
            </form>
        </main>
    )
}

export default App

function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const input = (document.querySelector('.type-input input') as HTMLInputElement).value;
    const parsed = parseTerm(input);

    if (parsed.isFailure) {
        console.error('Error parsing term:', parsed.error);
        return;
    }

    console.log(getTerm(parsed.value));
    const term = replaceParamWithType(parsed.value);

    if (term.isFailure) {
        console.error('Error replacing parameters with types:', term.error);
        return;
    }

    const type = infereType(term.value);

    if (type.isSuccess)
        console.log(getType(type.value));

    else 
        console.error(type.error);

    // Here you would call your type inference function and display the results
}

function getType(type: Type): string {
    if (type.kind === "var") {
        return type.name;
    }
    else if (type.kind === "fun") {
        return `(${getType(type.from)} -> ${getType(type.to)})`;
    }

    return "Unknown type";
}
