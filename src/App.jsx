// Packages
import React, { useCallback, useEffect, useState } from 'react'
import fetch from 'cross-fetch'

// Styles
import './App.css'

const URL_PATH = "https://gist.githubusercontent.com/bar0191/fae6084225b608f25e98b733864a102b/raw/dea83ea9cf4a8a6022bfc89a8ae8df5ab05b6dcc/pokemon.json"

const loadPokemons = async () => {
    const rawResponse = await fetch(URL_PATH)
    const response = await rawResponse.json()
    return response
}

const App = () => {
    const [pokemons, setPokemons] = useState([])
    const [query, setQuery] = useState('')
    const [maxCPChecked, setMaxCPChecked] = useState(false)

    useEffect(() => {
        ;(async () => {
            const pokemons = await loadPokemons()
            setPokemons(pokemons)
        })()
    }, [])

    const filterPokemons = useCallback(pokemons => {
        return pokemons.filter(pokemon => {
            if (query === '') { // If there's no query yet, don't filter anything
                return true
            }
            if (pokemon.Name.toLowerCase().includes(query.toLowerCase())) { // Check if the Name matches the query
                return true
            }
            let typeFound = false
            for (let i = 0; i < pokemon.Types.length; i++) { // Check if one of the Types matches the query
                if (pokemon.Types[i].toLowerCase().includes(query.toLowerCase())) {
                    typeFound =  true
                }
            }
            if (typeFound) {
                return true
            }
            return false
        })
    }, [query])

    const sortPokemonsByNameAndTag = useCallback(pokemons => {
        return pokemons.sort((pokemonA, pokemonB) => {
            const pokemonANameFound = pokemonA.Name.toLowerCase().includes(query.toLowerCase()) ? 1 : -1
            const pokemonBNameFound = pokemonB.Name.toLowerCase().includes(query.toLowerCase()) ? 1 : -1
            const nameComparison = pokemonBNameFound - pokemonANameFound // If only one of the Names matches the query we'll get a 2 or a -2 as a result of the substraction, otherwise we'll get a 0. We can use that result as the return value the sort method expects
            return nameComparison !== 0 ? nameComparison : pokemonA.Name.localeCompare(pokemonB.Name) // If only one of the Names matches the query, ascend that one, otherwise just sort them alphabetically by Name
        })
    }, [query])

    const sortPokemonsByMaxCP = useCallback(pokemons => {
        return pokemons.sort((pokemonA, pokemonB) => (pokemonB.MaxCP || 0) - (pokemonA.MaxCP || 0))
    }, [])

    const onTextInputChange = useCallback(e => {
        setQuery(e.target.value)
    }, [])

    const onCheckboxInputChange = useCallback(e => {
        setMaxCPChecked(e.target.checked)
    }, [])

    const renderHighlitedName = useCallback(name => {
        const regex = new RegExp(query, 'gi')

        let indexes = []
        let match
        while ((match = regex.exec(name)) != null) { // Get all the indexes of the substring positions where there query matches the Name
            indexes.push(match.index)
        }

        let position = 0
        const substrings = [] // We store all the highlited/unhighlited substrings in an array, so we can later map them to the corresponding JSX elements
        indexes.forEach(index => {
            if (position < index) { // Only generate unhighlited substring if the next index is ahead of the current position
                const nonHighlitedSubstring = name.substring(position, index)
                substrings.push({ value: nonHighlitedSubstring, highlited: false })
            }
            const highlitedSubstring = name.substring(index, index + query.length)
            substrings.push({ value: highlitedSubstring, highlited: true })
            position = index + query.length
        })
        if (position < name.length - 1) { // Only generate unhighlited remaining string if the length of the name is larger than the current position
            const remainingSubstring = name.substring(position, name.length)
            substrings.push({ value: remainingSubstring, highlited: false })
        }

        const highlitedNameElements = substrings.map((substring, i) => (<span key={i} className={substring.highlited ? 'hl' : ''}>{ substring.value }</span>))

        return highlitedNameElements
    }, [query])

    const filteredPokemons = maxCPChecked // Get filtered pokemons (the logic varies depending on the maxCPChecked flag)
        ? sortPokemonsByMaxCP(sortPokemonsByNameAndTag(filterPokemons(pokemons))).slice(0, 4)
        : sortPokemonsByNameAndTag(filterPokemons(pokemons)).slice(0, 4)

    console.log('Top results:', filteredPokemons.map(filteredPokemon => ({ name: filteredPokemon.Name, maxCP: filteredPokemon.MaxCP }))) // This helps to easily check the top results MaxCP values in the browser console

    return (<React.Fragment>
        <label htmlFor="maxCP" className="max-cp">
            <input type="checkbox" id="maxCP" value={maxCPChecked} onChange={onCheckboxInputChange} />
            <small>Maximum Combat Points</small>
        </label>
        <input type="text" className="input" placeholder="Pokemon or type" value={query} onChange={onTextInputChange} />
        { pokemons.length === 0 ? (<div className="loader"></div>) : null }
        { pokemons.length === 0 || query === '' ? null : (
            <ul className="suggestions">
                { filteredPokemons.length === 0 ? (
                    <li>
                        <img src="https://cyndiquil721.files.wordpress.com/2014/02/missingno.png" alt="" />
                        <div className="info">
                            <h1 className="no-results">No results</h1>
                        </div>
                    </li>
                ) : filteredPokemons.map((pokemon, i) => (
                    <li key={i}>
                        <img src={pokemon.img} alt={ pokemon.Name } />
                        <div className="info">
                            <h1>{ renderHighlitedName(pokemon.Name) }</h1>
                            { pokemon.Types.map((type, i) => (<span key={i} className={`type ${type.toLowerCase()}`}>{ type }</span>)) }
                        </div>
                    </li>
                )) }
            </ul>
        )}
    </React.Fragment>)
}

export default App
