class Graph_Visualization {
    constructor(root) {
        // Setup the element & defs:
        this.d3_root = d3.select(root);
        this.defs = this.d3_root.append('defs');

        // Simulation and link force updater tracker setup:
        this.simulation = d3.forceSimulation();
        
        // Keep a list of animations so we can run them when needed:
        this.animations = [];
        this.simulation.on('tick', () => {
            this.animations.forEach((animation) => animation());
        })
    }

    register_animation(tick_animation) {
        this.animations.push(tick_animation);
    }

    register_animations(tick_animations) {
        this.animations.push(...tick_animations);
    }

    register_force(name, force) {
        this.simulation.force(name, force);
    }

    register_forces(forces = {}) {
        for (const [name, d3_force] of Object.entries(forces)) {
            this.register_force(name, d3_force)
        }
    }

    register_def(selector, enter, update, exit) {
        
        let updater = (data, key) => {
            let data_copy = structuredClone(data);
            this.defs.selectAll(selector)
                .data(data_copy, key).join(enter, update, exit)
        }

        return(updater)
    }

    register_relation(selector, enter, update, exit, forces = {}, tick_animations = [], parent = this.d3_root) {
        
        this.register_forces(forces)
        this.register_animations(tick_animations)

        let updater = (data, key) => {
            let data_copy = structuredClone(data)
            parent.selectAll(selector)
                .data(data_copy, key).join(enter, update, exit)
            
            for (const force of Object.values(forces)) {
                force.links(data_copy);
            }
        }

        return(updater)
    }

    register_node(selector, enter, update, exit, forces = {}, tick_animations = [], parent = this.d3_root) {
        
        this.register_forces(forces)
        this.register_animations(tick_animations)
        
        let updater = (data, key) => {
            let data_copy = structuredClone(data)
            parent.selectAll(selector)
                .data(data_copy, key).join(enter, update, exit)
            this.simulation.nodes(data_copy);
        }

        return(updater)
    }
}