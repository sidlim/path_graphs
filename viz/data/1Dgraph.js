const Data = {
    'Aspirin Induced Asthma': {
        nodes: [
            { id: 1, label: 'Membrane Phospholipid' },
            { id: 2, label: 'Arachidonic Acid' },
            { id: 3, label: '5-HPETE' },
            { id: 4, label: 'LTE4' },
            { id: 5, label: 'LTD4' },
            { id: 6, label: 'LTC4' },
            { id: 7, label: 'LTB4' },
            { id: 8, label: 'Bronchoconstriction' },
            { id: 9, label: 'Cyclic Endoperoxide' },
            { id: 10, label: 'Prostacyclin' },
            { id: 11, label: 'Prostaglandins' },
            { id: 12, label: 'Thromboxane' }
        ],
        edges: [
            { source: 1, target: 2, label: 'Phospholipase A2' },
            { source: 2, target: 3, label: 'Lipoxygenase' },
            { source: 3, target: 4 },
            { source: 3, target: 5 },
            { source: 3, target: 6 },
            { source: 3, target: 7 },
            { source: 4, target: 8 },
            { source: 5, target: 8 },
            { source: 6, target: 8 },
            { source: 2, target: 9, label: 'Cyclooxygenase' },
            { source: 9, target: 10 },
            { source: 9, target: 11 },
            { source: 9, target: 12 }
        ]
    }
}