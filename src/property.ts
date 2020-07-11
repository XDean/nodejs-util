import {useEffect, useState} from "react";

export interface Listener<T> {
    (p: Property<T>, o: T, n: T): void
}

export interface Observable<T> {
    readonly value: T

    addListener(l: Listener<T>): void

    removeListener(l: Listener<T>): void

    nestProp<N>(f: (f: T) => Property<N>): Property<N>
}

export abstract class Property<T> implements Observable<T> {
    abstract value: T;
    protected listeners: Listener<T>[] = [];

    addListener(l: Listener<T>): void {
        this.listeners.push(l);
    };

    removeListener = (l: Listener<T>) => {
        const index = this.listeners.indexOf(l);
        if (index != -1) {
            this.listeners.splice(index, 1);
        }
    };

    nestProp = <N>(f: (f: T) => Property<N>) => {
        return new NestProperty<T, N>(this, f);
    };

    protected callListener = (old: T) => {
        this.listeners.forEach(l => {
            l(this, old, this.value);
        })
    }
}

export class SimpleProperty<T> extends Property<T> {
    private _value: T;

    get value(): T {
        return this._value;
    }

    set value(value: T) {
        if (this._value == value) {
            return;
        }
        this.update(v => value);
    }

    constructor(defaultValue: T) {
        super();
        this._value = defaultValue
    };

    update = (f: (t: T) => T | void) => {
        const oldValue = this._value;
        let v = f(this.value);
        if (v != null) {
            this._value = v;
        }
        this.callListener(oldValue)
    };
}

class NestProperty<F, T> extends Property<T> {
    private current: Property<T>;
    private innerListener: Listener<T> = (ob, o, n) => {
        this.callListener(o)
    };
    private ownerListener: Listener<F> = (ob, o, n) => {
        let old = this.current.value;
        this.current.removeListener(this.innerListener);
        this.current = this.map(n);
        this.current.addListener(this.innerListener);
        this.callListener(old)
    };

    constructor(
        private owner: Property<F>,
        private map: (f: F) => Property<T>,
    ) {
        super();
        this.current = map(owner.value);
        owner.addListener(this.ownerListener);
    }

    get value(): T {
        return this.current.value
    }

    set value(value: T) {
        this.current.value = value
    }
}

export function useProperty<S extends (any | any[])>(p: Property<S>): S {
    let [state, setState] = useState<S>(() => p.value);
    useEffect(() => {
        setState(p.value);
        const listener: Listener<S> = (ob, o, n) => {
            setState(n.slice ? n.slice() : n);
        };
        p.addListener(listener);
        return () => p.removeListener(listener);
    }, [p]);
    return state
}

export function usePropertyMap<S, T>(p: Property<S>, f: (s: S) => T): T {
    let [state, setState] = useState<T>(() => f(p.value));
    useEffect(() => {
        setState(f(p.value));
        const listener: Listener<S> = (ob, o, n) => setState(f(n));
        p.addListener(listener);
        return () => p.removeListener(listener);
    }, [p, f]);
    return state
}