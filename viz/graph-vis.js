class Graph_Visualization {
    constructor(root) {
        this.root = d3.select(root);
        this.defs = this.root.append('defs');
        this.simulation = d3.forceSimulation();
        this.animations = [];
        this.components = new Map();

        this.simulation.on('tick', () => {
            this.animations.forEach((animation) => animation(this.root));
        })
    }

    register_animation(tickAnimation) {
        this.animations.push(tickAnimation);
    }

    register_animations(tickAnimations) {
        this.animations.push(...tickAnimations);
    }

    register_force(name, force) {
        this.simulation.force(name, force);
    }

    register_forces(forces = {}) {
        for (const [name, force] of Object.entries(forces)) {
            this.register_force(name, force)
        }
    }

    register_def(defId, enter, update, exit) {
        this.defs.selectAll(`#${defId}`).data([defId]).join(enter, update, exit)
    }

    register(component, options = {/* Forces, container element, and interactivity */}) {

        const container = options.container || this.createContainer(component.componentId);

        this.components.set(component.componentId, {
            component: component,
            container: container,
            updater: component.getUpdater(this, container),
            forces: options.forces || {},
        });

        for (const def of component.requiredDefs) {
            this.register_def(def.id, def.enter, def.update, def.exit)
        }

        if (options.forces) {
            this.register_forces(options.forces);
        }
        this.register_animations(component.tickAnimations)

        //TODO: Check if all the required forces and the required defs are there for rendering
    }

    createContainer(componentId) {
        return(this.root.append('g').attr('class', `${componentId}-container`))
    }

    //TODO
    unregister(componentId) {

    }

    getComponent(componentId) {
        let component = this.components.get(componentId);
        if (!component) {throw new Error(`Component ${componentId} not found.`)}
        return(component)
    }

    enableZoom() {
        this.root.call(d3.zoom().on("zoom", (event) => {
            this.root.selectAll('& > g').attr("transform", event.transform)
        }))
    }

}

class Graph_Component {
    constructor(componentId, selector, enter, update, exit, animations = [], requiredForces = [], requiredDefs = []) {
        this.componentId = componentId;
        this.selector = selector;
        this.enter = enter;
        this.update = update;
        this.exit = exit;
        this.requiredForces = requiredForces;
        this.requiredDefs = requiredDefs;
        this.tickAnimations = animations;
    }

    getUpdater(visualization, parent) {
        let updater = (data, key) => {
            parent.selectAll(this.selector).data(data, key).join(this.enter, this.update, this.exit)
        }

        return(updater)
    }
}

class Graph_Node extends Graph_Component {
    constructor(componentId, selector, enter, update, exit, animations = [], requiredForces = [], requiredDefs = []) {
        super(componentId, selector, enter, update, exit, animations, requiredForces, requiredDefs)
    }

    getUpdater(visualization, parent) {
        let element_updater = super.getUpdater(visualization, parent);
        let sim_updater = (data, key) => {visualization.simulation.nodes(data, key)}

        return((data, key) => {
            element_updater(data, key);
            sim_updater(data, key);
        })
    }
}

class Graph_Relation extends Graph_Component {
    constructor(componentId, selector, enter, update, exit, animations = [], requiredForces = [], requiredDefs = []) {
        super(componentId, selector, enter, update, exit, animations, requiredForces, requiredDefs)
    }

    getUpdater(visualization, parent) {
        let element_updater = super.getUpdater(visualization, parent);
        let links_updater = (data, key) => {
            for (let force of Object.values(visualization.getComponent(this.componentId).forces)) {
                // Shared forces among different kinds of links may start to get buggy here.
                // Imagine: two different types of edges use the same force, because they're subtypes of the same edge
                // Then updating one clears the other's links data and vice versa.
                force.links(data, key)
            }
        }

        return((data, key) => {
            element_updater(data, key);
            links_updater(data, key);
        })
    }
}