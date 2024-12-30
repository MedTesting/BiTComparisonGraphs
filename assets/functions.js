const NODE_MAP_MIN_SIZE = 40;
const NODE_MAP_MAX_SIZE = 150;
const EDGE_MAP_MIN_SIZE = 1;
const EDGE_MAP_MAX_SIZE = 20;
const NORMALISE_MULTIPLIER = 100;

window.dash_clientside = Object.assign({}, window.dash_clientside, {
    clientside: {
        get_teams_for_group: async function (database, variable) {
            try {
                if (variable === 'Teams') {
                    const files = await read_files(database);
                    const teams = files[2];
                    return [teams.map(name => ({'label': name, 'value': name})), database];
                } else {
                    const names = await read_team_groups_from_file(database, variable);
                    return [names, database];
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        },

        get_teams_for_group_both_databases: async function (variable, database1, database2) {
            try {
                if (variable === 'Teams') {
                    const files1 = await read_files(database1);
                    const files2 = await read_files(database2);
                    const teams1 = files1[2];
                    const teams2 = files2[2];
                    return [teams1.map(name => ({'label': name, 'value': name})), teams2.map(name => ({
                        'label': name,
                        'value': name
                    })), variable];
                } else {
                    const names1 = await read_team_groups_from_file(database1, variable);
                    const names2 = await read_team_groups_from_file(database2, variable);
                    return [names1, names2, variable];
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        },

        get_meetings_for_team: async function (team, database, group_by) {
            try {
                const files = await read_files(database);
                var events = files[0];
                var meetings = []
                if (team === null) {
                    meetings.push('All');
                } else if (team === 'All') {
                    meetings = events.getColumn('sequenceId');
                    meetings = [...new Set(meetings)];
                    meetings = meetings.map(meeting => meeting.split('_')[0]);
                    meetings = [...new Set(meetings)];
                    meetings = meetings.filter(meeting => meeting !== "");
                    meetings.sort();
                    meetings.unshift('All');
                } else if (team.match(/\d+/g)) {
                    events = events.data.filter(event => event.sequenceId.split('_')[1] === team);
                    meetings = events.map(event => event.sequenceId.split('_')[0]);
                    meetings = [...new Set(meetings)];
                    meetings.sort();
                    meetings.unshift('All');
                } else {
                    const team_list = await read_teams_from_file(database, group_by, team);
                    events = events.data.filter(event => team_list.includes(event.sequenceId.split('_')[1]));
                    meetings = events.map(event => event.sequenceId.split('_')[0]);
                    meetings = [...new Set(meetings)];
                    meetings.sort();
                    meetings.unshift('All');
                }
                return [meetings.map(name => ({'label': name, 'value': name})), team];
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        },

        show_hide_edges: function (show, node_data, node_type, node_signs, colour_type, colour_source, edge_data, edge_signs) {
            edge_signs = new Map(edge_signs);
            // Change the keys of the map to string
            edge_signs = new Map([...edge_signs].map(([k, v]) => [JSON.stringify(k), v]));

            // Revert the keys of the map back to their original form
            // edge_signs = new Map([...edge_signs].map(([k, v]) => [JSON.parse(k), v]));

            var nodes = get_original_nodes(node_data, node_type, node_signs, colour_type);
            var edges = [];

            if (show.includes('All')) {
                edges = get_original_edges(edge_data, node_type, colour_type, colour_source, edge_signs)
            } else {
                show = show.toLowerCase()
                var current_edges = [];
                var original_edges = get_original_edges(edge_data, node_type, colour_type, colour_source, edge_signs);
                // Iterate over original edges and keep only the ones whose sign is equal to show value
                original_edges.forEach(edge => {
                    const sign = edge_signs.get(JSON.stringify([edge['data']['source'], edge['data']['target'], edge['data']['behaviour']]));
                    if (show.includes(sign)) {
                        current_edges.push(edge);
                    }
                });
                edges = current_edges;
            }
            // Append edges to nodes
            return nodes.concat(edges);
        },

        select_nodes: function (selected_nodes, node_data, node_type, node_signs, colour_type, colour_source, edge_data, edge_signs) {
            edge_signs = new Map(edge_signs);
            // Change the keys of the map to string
            edge_signs = new Map([...edge_signs].map(([k, v]) => [JSON.stringify(k), v]));
            const nodes = get_original_nodes(node_data, node_type, node_signs, colour_type);
            let edges;
            if (selected_nodes.length === 0) {
                edges = get_original_edges(edge_data, node_type, colour_type, colour_source, edge_signs);
            } else {
                const current_edges = [];
                selected_nodes.forEach(node => {
                    get_original_edges(edge_data, node_type, colour_type, colour_source, edge_signs).forEach(edge => {
                        if (colour_source === 'Source') {
                            if (edge['data']['source'] === node['id']) {
                                current_edges.push(edge);
                            }
                        } else {
                            if (edge['data']['target'] === node['id']) {
                                current_edges.push(edge);
                            }
                        }
                    });
                });
                edges = current_edges;
            }
            return nodes.concat(edges);
        },

        show_weight_edges: function (weight, node_data, node_type, edge_type, node_signs, colour_type, colour_source, edge_data, edge_signs, min_weight, max_weight, show_edges) {
            edge_signs = new Map(edge_signs);
            // Change the keys of the map to string
            edge_signs = new Map([...edge_signs].map(([k, v]) => [JSON.stringify(k), v]));
            const nodes = get_original_nodes(node_data, node_type, node_signs, colour_type);
            let edges;

            let current_edges = [];
            const original_edges = get_original_edges(edge_data, node_type, colour_type, colour_source, edge_signs);
            original_edges.forEach(edge => {
                if (show_edges === 'All') {
                    if (edge_type === 'Probability') {
                        if (weight[0] <= edge['data']['weight'] && edge['data']['weight'] <= weight[1]) {
                            current_edges.push(edge);
                        }
                    } else {
                        if (weight[0] <= edge['data']['weight'] && edge['data']['weight'] <= weight[1]) {
                            current_edges.push(edge);
                        }
                    }
                } else {
                    if (edge_signs.get(JSON.stringify([edge['data']['source'], edge['data']['target'], edge['data']['behaviour']])) === show_edges.toLowerCase()) {
                        if (edge_type === 'Probability') {
                            if (weight[0] <= edge['data']['weight'] && edge['data']['weight'] <= weight[1]) {
                                current_edges.push(edge);
                            }
                        } else {
                            if (weight[0] <= edge['data']['weight'] && edge['data']['weight'] <= weight[1]) {
                                current_edges.push(edge);
                            }
                        }
                    }
                }
            });
            edges = current_edges;
            return [nodes.concat(edges), "Weight threshold: " + parseFloat(weight[0]).toFixed(2) + " - " + parseFloat(weight[1]).toFixed(2)];
        },

        update_graph: async function (n_clicks, group_by, database_1, team_1, meeting_1, database_2, team_2, meeting_2, node_type, edge_type, colour_type, colour_source, normalise, legend_style, default_style) {
            const valid = check_validity(node_type, colour_type, team_1, team_2);

            if (valid) {
                const graph_elements = await create_comparison_graph(group_by, database_1, team_1, meeting_1, database_2, team_2, meeting_2, node_type, edge_type, colour_type, colour_source, normalise);
                const node_data = graph_elements[0];
                const edge_data = graph_elements[1];
                const nodes = graph_elements[2];
                const edges = graph_elements[3];
                const selector_node_classes = graph_elements[4];
                const selector_edge_classes = graph_elements[5];
                const min_weight = graph_elements[6];
                const max_weight = graph_elements[7];
                const weight_bins = graph_elements[8];
                const node_signs = graph_elements[9];
                var edge_signs = graph_elements[10];
                const node_names = graph_elements[11];
                const behaviours = graph_elements[12];
                const node_size_map = graph_elements[13];
                const legend_nodes = get_legend_nodes(node_names, selector_node_classes, colour_type, behaviours, node_size_map);
                // Convert the edge signs from {Bringing_in,Bringing_in,: "positive", Bringing_in,Building,: "negative",...} to [[[Bringing_in,Bringing_in],positive], [[Bringing_in,Building],negative],...]
                edge_signs = Object.entries(edge_signs).map(([k, v]) => [[...k.split(',')], v]);
                return [edges.concat(nodes), selector_node_classes.concat(selector_edge_classes).concat(default_style), min_weight, max_weight + 1, weight_bins, [min_weight, max_weight], legend_nodes, selector_node_classes.concat(legend_style), node_data, edge_data, node_signs, edge_signs];
            } else {
                window.dash_clientside.no_update;
            }
        }
    }
});

function get_original_nodes(node_data, node_type, node_signs, colour_type) {
    var original_nodes = [];
    if (node_type === 'Behaviours') {
        original_nodes = node_data.map((node, i) => {
            return {
                'data': {'id': node[0], 'label': node[1], 'freq': node[2], 'size': node[5]},
                'position': {'x': 20 * node[4], 'y': -20 * node[3]},
                'classes': "node" + node[0] + node_signs[i]
            }
        });
    }
    else {
        if (colour_type === 'Behaviours') {
            original_nodes = node_data.map((node, i) => {
                return {
                    'data': {'id': node[0], 'label': node[1], 'freq': node[2], 'size': node[5]},
                    'position': {'x': 20 * node[4], 'y': -20 * node[3]},
                    'classes': "nodeParticipant" + node_signs[i]
                }
            });
        }
        else {
            original_nodes = node_data.map((node, i) => {
                return {
                    'data': {'id': node[0], 'label': node[1], 'freq': node[2], 'size': node[5]},
                    'position': {'x': 20 * node[4], 'y': -20 * node[3]},
                    'classes': "node" + node[0] + node_signs[i]
                }
            });
        }
    }
    return original_nodes;
}

function get_original_edges(edge_data, node_type, colour_type, colour_source, edge_signs) {
    var original_edges = [];
    if (node_type === 'Behaviours') {
        if (colour_source === "Source") {
            original_edges = edge_data.map((edge, i) => {
                return {
                    'data': {'source': edge[0], 'target': edge[1], 'behaviour': edge[2], 'weight': edge[3], 'original_weight': edge[4]},
                    'classes': "edge" + edge[0]
                }
            });
        } else {
            original_edges = edge_data.map((edge, i) => {
                return {
                    'data': {'source': edge[0], 'target': edge[1], 'behaviour': edge[2], 'weight': edge[3], 'original_weight': edge[4]},
                    'classes': "edge" + edge[1]
                }
            });
        }
    } else {
        if (colour_type === 'Behaviours') {
            original_edges = edge_data.map((edge, i) => {
                return {
                    'data': {
                        'source': edge[0],
                        'target': edge[1],
                        'weight': edge[3],
                        'original_weight': edge[4],
                        'behaviour': edge[2]
                    },
                    'classes': "edge" + edge[2]
                }
            });
        } else {
            if (colour_source === "Source") {
                original_edges = edge_data.map((edge, i) => {
                    return {
                        'data': {
                            'source': edge[0],
                            'target': edge[1],
                            'weight': edge[3],
                            'original_weight': edge[4],
                            'behaviour': edge[2]
                        },
                        'classes': "edge" + edge[0]
                    }
                });
            } else {
                original_edges = edge_data.map((edge, i) => {
                    return {
                        'data': {
                            'source': edge[0],
                            'target': edge[1],
                            'weight': edge[3],
                            'original_weight': edge[4],
                            'behaviour': edge[2]
                        },
                        'classes': "edge" + edge[1]
                    }
                });
            }
        }
    }
    // Change the class of each edge depending on the sign of the weight (add word positive or negative)
    original_edges = original_edges.map((edge) => {
        edge['classes'] += edge_signs.get(JSON.stringify([edge['data']['source'], edge['data']['target'], edge['data']['behaviour']]));
        return edge;
    });
    return original_edges;
}

async function read_files(database) {
    const events_file = "https://raw.githubusercontent.com/LuisMontanaG/BiTComparisonGraphs/refs/heads/main/" + database + "/Events.csv"
    const entities_file = "https://raw.githubusercontent.com/LuisMontanaG/BiTComparisonGraphs/refs/heads/main/" + database + "/EntityAttributes.csv"

    const event_data = await fetch(events_file)
    const entity_data = await fetch(entities_file)
    const events_data = await event_data.text()
    const entities_data = await entity_data.text()

    // Split the data into rows
    const events_rows = events_data.split('\n')
    const entities_rows = entities_data.split('\n')

    // Create a DataFrame
    const events = new DataFrame(events_rows)
    const entities = new DataFrame(entities_rows)

    events.drop(['start', 'eventId'])
    events.removeRows('event', 'Online')

    entities.drop(['sequenceId'])

    // Get teams
    var teams = events.getColumn('sequenceId');
    teams = [...new Set(teams)];
    teams = teams.map(team => team.split('_')[1]);
    teams = [...new Set(teams)];
    teams = teams.filter(team => team !== undefined);
    teams.sort();
    teams.unshift('All');

    // Get behaviours
    var behaviours = events.getColumn('event');
    behaviours = [...new Set(behaviours)];
    behaviours = behaviours.filter(behaviour => behaviour !== 'Break' && behaviour !== undefined);

    // Get meetings
    var meetings = events.getColumn('sequenceId');
    meetings = [...new Set(meetings)];
    meetings = meetings.map(meeting => meeting.split('_')[0]);
    meetings = [...new Set(meetings)];
    meetings = meetings.filter(meeting => meeting !== "");
    meetings.sort();
    meetings.unshift('All');

    return [events, entities, teams, behaviours, meetings];
}

async function read_team_groups_from_file(database, variable) {
    const file = "https://raw.githubusercontent.com/LuisMontanaG/BiTComparisonGraphs/refs/heads/main/" + database + "/Variables.csv"
    const data = await fetch(file)
    const variables_data = await data.text()

    const lines = variables_data.split('\n')
    lines.pop();
    var is_variable = false;
    var names = [];

    lines.forEach(line => {
        if (line.includes('Attribute')) {
            is_variable = line.includes(variable);
        }
        if (is_variable) {
            if (line.startsWith('ids')) {
                names.push(line.split(':')[1].trim());
            }
        }
    });
    return names.map(name => ({'label': name, 'value': name}));
}

async function read_teams_from_file(database, variable, group_name) {
    const file = "https://raw.githubusercontent.com/LuisMontanaG/BiTComparisonGraphs/refs/heads/main/" + database + "/Variables.csv"
    const data = await fetch(file)
    const variables_data = await data.text()

    const lines = variables_data.split('\n')
    lines.pop();
    var is_variable = false;
    var is_group = false;
    var teams = [];
    lines.forEach(line => {
        if (line.includes('Attribute')) {
            is_variable = line.includes(variable);
            return;
        }
        if (is_variable) {
            if (line.includes(group_name)) {
                is_group = true;
                return;
            }
        }
        if (is_group) {
            teams = line.split(',');
            teams = teams.filter(team => team !== 'NA');
            teams = teams.map(team => team.split('_')[1].trim());
            is_group = false;
            is_variable = false;
        }
    });
    return teams
}

function check_validity(node_type, colour_type, team_1, team_2) {
    if (node_type === 'Behaviours' && colour_type === 'Behaviours') {
        return true;
    }
    else {
        if (team_1 === 'All' || team_2 === 'All') {
            return false;
        }
    }
    return true;
}

function get_legend_nodes(node_names, selector_node_classes, colour_type, behaviours, node_size_map) {
    if (colour_type === 'Behaviours') {
        node_names = behaviours;
    }
    // Create a list of random longitudes and latitudes with the size of the number of acronyms
    let longitudes = [];
    let latitudes = [];
    for (let i = 0; i < node_names.length; i++) {
        longitudes.push(Math.random() * 700);
        latitudes.push(Math.random() * 0);
    }

    const size = parseFloat(node_size_map.split(',')[1]);

    // Create an array of size len(node_names) with the value 20
    let sizes = Array(node_names.length).fill(size);

    let node_data = [];
    for (let i = 0; i < node_names.length; i++) {
        node_data.push([node_names[i], longitudes[i], latitudes[i], sizes[i]]);
    }

    let nodes = [];
    for (let i = 0; i < node_data.length; i++) {
        nodes.push({
            'data': {'label': node_data[i][0], 'size': node_data[i][3]},
            'position': {'x': 20, 'y': -1},
            'classes': "node" + node_data[i][0]
        });
    }
    return nodes;
}

async function create_comparison_graph(group_by, database_1, team_1, meeting_1, database_2, team_2, meeting_2, node_type, edge_type, colour_type, colour_source, normalise) {
    const file_data_1 = await read_files(database_1);
    const events_1 = file_data_1[0];
    const entities_1 = file_data_1[1];
    const behaviours_1 = file_data_1[3];
    const file_data_2 = await read_files(database_2);
    const events_2 = file_data_2[0];
    const entities_2 = file_data_2[1];
    const behaviours_2 = file_data_2[3];

    var node_data_list = [];
    var edge_data_list = [];

    var team_1_list = [];
    var team_2_list = [];

    if (group_by !== 'Teams') {
        team_1_list = await read_teams_from_file(database_1, group_by, team_1);
        team_2_list = await read_teams_from_file(database_2, group_by, team_2);
    }

    if (node_type === 'Behaviours') {
        var node_dat = get_behaviour_node_data(events_1, team_1_list, team_1, meeting_1, normalise);
        var edge_dat = get_behaviour_edge_data(edge_type, team_1_list, events_1, team_1, meeting_1, normalise);
        node_data_list.push(node_dat);
        edge_data_list.push(edge_dat);
        var node_data_2 = get_behaviour_node_data(events_2, team_2_list, team_2, meeting_2, normalise);
        var edge_data_2 = get_behaviour_edge_data(edge_type, team_2_list, events_2, team_2, meeting_2, normalise);
        node_data_list.push(node_data_2);
        edge_data_list.push(edge_data_2);
    }
    else {
        var node_dat = get_participant_node_data(events_1, entities_1, team_1, meeting_1, normalise)
        var edge_dat = get_participant_edge_data(edge_type, events_1, team_1, meeting_1, entities_1, normalise);
        node_data_list.push(node_dat);
        edge_data_list.push(edge_dat);
        var node_data_2 = get_participant_node_data(events_2, entities_2, team_2, meeting_2, normalise);
        var edge_data_2 = get_participant_edge_data(edge_type, events_2, team_2, meeting_2, entities_2, normalise);
        node_data_list.push(node_data_2);
        edge_data_list.push(edge_data_2);
    }

    var node_data_diff = get_node_data_diff(node_data_list, node_type);
    const node_names = node_data_diff[0];
    const acronyms = node_data_diff[1];
    const acronyms_dict = node_data_diff[2];
    const freq = node_data_diff[3];
    const sizes = node_data_diff[4];
    const node_size_map = node_data_diff[5];
    const node_signs = node_data_diff[6];

    var edge_data_diff = get_edge_data_diff(edge_data_list, edge_type, normalise);
    const edge_data = edge_data_diff[0];
    const min_weight = edge_data_diff[1];
    const max_weight = edge_data_diff[2];
    const weight_bins = edge_data_diff[3];
    const edge_size_map = edge_data_diff[4];
    const edge_signs = edge_data_diff[5];

    var colors = get_colors(node_names, behaviours_1, colour_type);
    const selector_classes = get_selector_classes_comparison(node_names, behaviours_1, colors, node_size_map, edge_size_map, colour_type)
    const selector_node_classes = selector_classes[0];
    const selector_edge_classes = selector_classes[1];

    const nodes_comparison = get_nodes_comparison(node_names, acronyms, freq, sizes, node_type, node_signs, colour_type)
    const node_data = nodes_comparison[0];
    const nodes = nodes_comparison[1];

    let edges = []
    if (node_type === 'Behaviours') {
        edges = get_behaviour_edges_comparison(edge_data, colour_source, edge_signs)
    } else {
        edges = get_participant_edges_comparison(edge_data, colour_type, colour_source, edge_signs)
    }
    return [node_data, edge_data, nodes, edges, selector_node_classes, selector_edge_classes, min_weight, max_weight, weight_bins, node_signs, edge_signs, node_names, behaviours_1, node_size_map]
}

function get_behaviour_node_data(events, team_list, team, meeting, normalise) {
    if (team_list.length === 0) {
        if (team !== 'All') {
            // Keep only rows where sequenceId contains team
            events.data = events.data.filter(event => event.sequenceId.split('_')[1] === team);
        }
    }
    else {
        // Convert the following python code to javascript
        // events = events[events['sequenceId'].str.split('_').str[1].isin(team_list)]
        events.data = events.data.filter(event => team_list.includes(event.sequenceId.split('_')[1]));
    }

    // Keep only rows where meeting is equal to the selected meeting. Use removeRows method
    if (meeting !== 'All') {
        events.data = events.data.filter(event => event.sequenceId.split('_')[0] === meeting);
    }

    // Get node names
    let node_names = events.getColumn('event');
    node_names = [...new Set(node_names)];
    node_names = node_names.filter(node => node !== 'Break' && node !== undefined);

    // Get node frequencies as dictionary
    let freqs = {};
    node_names.forEach(node => {
        freqs[node] = events.data.filter(event => event.event === node).length;
    });

    if (normalise) {
        for (let [key, value] of Object.entries(freqs)) {
            freqs[key] = (value / events.getNumRows()) * NORMALISE_MULTIPLIER;
        }
    }

    return[node_names, freqs];
}

function get_participant_node_data(events, entities, team, meeting, normalise) {
    // Get entityIds of participants in the team.
    // Keep only rows where sequenceId split by '_' is equal to team
    let entityIds = events;
    entityIds.data = events.data.filter(event => event.sequenceId.split('_')[1] === team);
    entityIds.removeRows('entityId', '-1');
    entityIds = entityIds.getColumn('entityId');
    entityIds = [...new Set(entityIds)];

    // Keep only rows where ParameterKey is 'name'
    entities.keepOnlyRows('ParameterKey', 'name');
    // Keep only rows where entityId is in entityIds
    entities.data = entities.data.filter(entity => entityIds.includes(entity.entityId));
    // Get names of participants
    let participants = entities.getColumn('ParameterValue');
    participants = [...new Set(participants)];

    // Get node names
    let node_names = participants;

    // Get node frequencies as dictionary
    // Keep events where entityId is in entityIds
    events.data = events.data.filter(event => entityIds.includes(event.entityId));
        // Keep only rows where meeting is equal to the selected meeting. Use removeRows method
    if (meeting !== 'All') {
        events.data = events.data.filter(event => event.sequenceId.split('_')[0] === meeting);
    }
    let freqs = {};
    entityIds.forEach(id => {
        freqs[id] = events.data.filter(event => event.entityId === id).length;
    });

    if (normalise) {
        for (let [key, value] of Object.entries(freqs)) {
            freqs[key] = (value / events.getNumRows()) * NORMALISE_MULTIPLIER;
        }
    }

    // Replace entityIds with names in freqs
    for (let [key, value] of Object.entries(freqs)) {
        const index = entityIds.indexOf(key);
        freqs[participants[index]] = freqs[key];
        delete freqs[key];
    }

    return [node_names, freqs, entities];
}

function get_behaviour_edge_data(edge_type, team_list, events, team, meeting, normalise) {
    if (team_list.length === 0) {
        if (team !== 'All') {
            // Keep only rows where sequenceId contains team
            events.data = events.data.filter(event => event.sequenceId.split('_')[1] === team);
        }
    }
    else {
        events.data = events.data.filter(event => team_list.includes(event.sequenceId.split('_')[1]));
    }

    // Keep only rows where meeting is equal to the selected meeting. Use removeRows method
    if (meeting !== 'All') {
        events.data = events.data.filter(event => event.sequenceId.split('_')[0] === meeting);
    }

    // Remove rows where event is 'Break'
    events.removeRows('event', 'Break');
    // Get edges
    let edges = {}
    for (let i = 1; i < events.getNumRows(); i++) {
        const key = [events.data[i - 1].event, events.data[i].event];
        if (edges[key]) {
            edges[key] += 1;
        } else {
            edges[key] = 1;
        }
    }
    if (edge_type === 'Probability') {
        let source_sum = {};
        for (let [key, value] of Object.entries(edges)) {
            const source = key[0];
            if (source_sum[source]) {
                source_sum[source] += value;
            } else {
                source_sum[source] = value;
            }
        }
        for (let [key, value] of Object.entries(edges)) {
            const source = key[0];
            edges[key] = (value / source_sum[source] * 100);
        }
    }
    // Convert dictionary to a list of lists
    let edge_data = [];
    if (edge_type === 'Frequency') {
        if (!normalise) {
            for (let [key, value] of Object.entries(edges)) {
                key = key.split(',');
                edge_data.push([key[0], key[1], "", Math.log2(value), value]);
            }
        }
        else {
            for (let [key, value] of Object.entries(edges)) {
                key = key.split(',');
                edge_data.push([key[0], key[1], "", (value / events.getNumRows()) * NORMALISE_MULTIPLIER ,value]);
            }
        }
    }
    else {
        for (let [key, value] of Object.entries(edges)) {
            key = key.split(',');
            edge_data.push([key[0], key[1], "", (value / 100) * source_sum[key[0]] ,value]);
        }
    }
    return edge_data;
}

function get_participant_edge_data(edge_type, events, team, meeting, entities, normalise) {
    // Get events rows where sequenceId contains team
    events.data = events.data.filter(event => event.sequenceId.split('_')[1] === team);
    // Remove rows where entityId is -1
    events.removeRows('entityId', '-1');
    // Keep meeting only
    if (meeting !== 'All') {
        events.data = events.data.filter(event => event.sequenceId.split('_')[0] === meeting);
    }

    // Replace entityIds with names
    events.data = events.data.map(event => {
        const index = entities.data.findIndex(entity => entity.entityId === event.entityId);
        event.entityId = entities.data[index].ParameterValue;
        return event;
    });

    // Get edges
    // From events, count the number of transitions between entityIds, including the event transition. Save in a dictionary [entityId1, entityId2, event]: count
    let edges = {}
    for (let i = 1; i < events.getNumRows(); i++) {
        const key = [events.data[i - 1].entityId, events.data[i].entityId, events.data[i].event];
        if (edges[key]) {
            edges[key] += 1;
        } else {
            edges[key] = 1;
        }
    }

    if (edge_type === 'Probability') {
        let source_sum = {};
        for (let [key, value] of Object.entries(edges)) {
            const source = key[0];
            if (source_sum[source]) {
                source_sum[source] += value;
            } else {
                source_sum[source] = value;
            }
        }
        for (let [key, value] of Object.entries(edges)) {
            const source = key[0];
            edges[key] = (value / source_sum[source] * 100);
        }
    }
    // Convert dictionary to a list of lists
    let edge_data = [];
    if (edge_type === 'Frequency') {
        if (!normalise) {
            for (let [key, value] of Object.entries(edges)) {
                key = key.split(',');
                edge_data.push([key[0], key[1], key[2], Math.log2(value), value]);
            }
        }
        else {
            for (let [key, value] of Object.entries(edges)) {
                key = key.split(',');
                edge_data.push([key[0], key[1], key[2], (value / events.getNumRows()) * NORMALISE_MULTIPLIER, value]);
            }
        }
    }
    else {
        for (let [key, value] of Object.entries(edges)) {
            key = key.split(',');
            edge_data.push([key[0], key[1], key[2], (value / 100) * source_sum[key[0]], value]);
        }
    }

    return edge_data;
}

function get_node_data_diff(node_data_list, node_type) {
    let node_names = [];
    let freq = []

    // Get node names and frequencies
    for (let node_data of node_data_list) {
        node_names.push(node_data[0]);
        freq.push(node_data[1]);
    }

    // Get the union of all node names
    let node_names_diff = [];
    for (let names of node_names) {
        node_names_diff = node_names_diff.concat(names);
    }
    node_names_diff = [...new Set(node_names_diff)];

    // Get acronyms of node names. For behaviours, acronyms are the first letter of each word in the name
    let acronyms = [];
    if (node_type === 'Behaviours') {
        for (let name of node_names_diff) {
            acronyms.push(name.split('_').map(word => word[0]).join(''));
        }
        // Ensure acronyms are uppercase
        acronyms = acronyms.map(acronym => acronym.toUpperCase());
    }
    else {
        acronyms = node_names_diff;
    }
    // Get acronym dictionary
    let acronyms_dict = {};
    for (let i = 0; i < node_names_diff.length; i++) {
        acronyms_dict[node_names_diff[i]] = acronyms[i];
    }

    // Ensure that freqs have all the node names (Add 0 if not present)
    for (let i = 0; i < freq.length; i++) {
        for (let name of node_names_diff) {
            if (!freq[i][name]) {
                freq[i][name] = 0;
            }
        }
    }

    // Calculate the difference in frequency between the two datasets
    let freq_diff = {};
    for (let name of node_names_diff) {
        freq_diff[name] = freq[1][name] - freq[0][name];
    }

    // Get size = freq_diff values
    let sizes = [];
    for (let name of node_names_diff) {
        sizes.push(freq_diff[name]);
    }

    // Get an array of 1 and -1 to depending on the size value
    let signs = sizes.map(value => value / Math.abs(value));

    // Change -1 for "negative" and 1 for "positive" and 0 for "" in signs
    for (let i = 0; i < signs.length; i++) {
        if (signs[i] === -1) {
            signs[i] = "negative";
        } else if (signs[i] === 1) {
            signs[i] = "positive";
        } else {
            signs[i] = "";
        }
    }

    // Change the sign of the sizes to positive
    sizes = sizes.map(value => Math.abs(value));

    // Change the sign of freq_diff to positive
    for (let [key, value] of Object.entries(freq_diff)) {
        freq_diff[key] = Math.abs(value);
    }

    // Size map
    const size_map = "mapData(size," + Math.min(...sizes) + "," + Math.max(...sizes) + "," + NODE_MAP_MIN_SIZE + "," + NODE_MAP_MAX_SIZE + ")";

    return [node_names_diff, acronyms, acronyms_dict, freq_diff, sizes, size_map, signs];
}

function get_edge_data_diff(edge_data_list, edge_type, normalise) {
    // Append all the edge data to a list
    let edge_data = [];
    for (let edge of edge_data_list) {
        let edge_dat = [];
        for (let i = 0; i < edge.length; i++) {
            edge_dat.push(edge[i]);
        }
        edge_data.push(edge_dat);
    }

    // Get the unique combinations of source, target and behaviour in the edge data
    let edge_data_diff = [];
    for (let i = 0; i < edge_data.length; i++) {
        for (let j = 0; j < edge_data[i].length; j++) {
            if (!edge_data_diff.includes([edge_data[i][j][0], edge_data[i][j][1], edge_data[i][j][2], 0.0, 0.0])) {
                edge_data_diff.push([edge_data[i][j][0], edge_data[i][j][1], edge_data[i][j][2], 0.0, 0.0]);
            }
        }
    }

    // Convert data each list in edge_data to a dictionary (key: [source, target, behaviour], value: [weight, original_weight])
    for (let i = 0; i < edge_data.length; i++) {
        let edge_dat = {};
        for (let j = 0; j < edge_data[i].length; j++) {
            edge_dat[[edge_data[i][j][0], edge_data[i][j][1], edge_data[i][j][2]]] = [edge_data[i][j][3], edge_data[i][j][4]];
        }
        edge_data[i] = edge_dat;
    }

    // Convert edge_data_diff to a dictionary (key: (source, target, behaviour), value: (weight, original_weight))
    let edge_data_diff_dict = {};
    for (let edge of edge_data_diff) {
        edge_data_diff_dict[[edge[0], edge[1], edge[2]]] = [edge[3], edge[4]];
    }
    edge_data_diff = edge_data_diff_dict;

    // Ensure that both edge data dictionaries have the same keys in edge_data_diff
    for (let i = 0; i < edge_data.length; i++) {
        for (let [key, value] of Object.entries(edge_data_diff)) {
            if (!edge_data[i][key]) {
                edge_data[i][key] = [0.0, 0.0];
            }
        }
    }

    // Calculate the difference in weight between the two datasets
    for (let [key, value] of Object.entries(edge_data_diff)) {
        edge_data_diff[key] = [edge_data[1][key][0] - edge_data[0][key][0], edge_data[1][key][1] - edge_data[0][key][1]];
    }

    // Remove edges with weight equal to 0
    for (let [key, value] of Object.entries(edge_data_diff)) {
        if (value[1] === 0.0) {
            delete edge_data_diff[key];
        }
    }

    // Dictionary of signs (positive or negative) for each weight. Use absolute value
    let signs = {};
    for (let [key, value] of Object.entries(edge_data_diff)) {
        signs[key] = value[1] / Math.abs(value[1]);
    }
    // Change -1 for "negative" and 1 for "positive" and 0 for "" in signs
    for (let [key, value] of Object.entries(signs)) {
        if (value === -1) {
            signs[key] = "negative";
        } else if (value === 1) {
            signs[key] = "positive";
        } else {
            signs[key] = "";
        }
    }

    if (!normalise) {
        // Change the sign of the weights to positive
        for (let [key, value] of Object.entries(edge_data_diff)) {
            edge_data_diff[key][0] = Math.abs(value[1]);
            edge_data_diff[key][1] = Math.abs(value[1]);
        }
        // Remove value[0] from edge_data_diff
        for (let [key, value] of Object.entries(edge_data_diff)) {
            edge_data_diff[key] = value[1];
        }
    }
    else {
        // Change the sign of the weights to positive
        for (let [key, value] of Object.entries(edge_data_diff)) {
            edge_data_diff[key][0] = Math.abs(value[0]);
            edge_data_diff[key][1] = Math.abs(value[0]);
        }
        // Remove value[1] from edge_data_diff. Keep normalised weight
        for (let [key, value] of Object.entries(edge_data_diff)) {
            edge_data_diff[key] = value[0];
        }
    }

    if (edge_type === 'Probability') {
        let source_sum = {};
        for (let [key, value] of Object.entries(edge_data_diff)) {
            const source = key[0];
            if (source_sum[source]) {
                source_sum[source] += value;
            } else {
                source_sum[source] = value;
            }
        }
        for (let [key, value] of Object.entries(edge_data_diff)) {
            const source = key[0];
            edge_data_diff[key] = (value / source_sum[source] * 100);
        }
    }

    // Create an array of edge_data_diff values
    let weights = [];
    for (let [key, value] of Object.entries(edge_data_diff)) {
        weights.push(value);
    }
    const min_weight = Math.min(...weights);
    const max_weight = Math.max(...weights);

    // Create 20 bins in the range of min_weight and max_weight + 1 (to include max_weight)
    let weight_bins = [];
    for (let i = 0; i < 20; i++) {
        weight_bins.push(min_weight + i * ((max_weight + 1 - min_weight) / 20));
    }
    // Create a dictionary of strings from weight_bins, for each weight (key: weight, value: weight)
    let weight_bins_dict = {};
    for (let i = 0; i < weight_bins.length - 1; i++) {
        weight_bins_dict[parseInt(weight_bins[i]) + ""] = parseInt(weight_bins[i]) + "";
    }
    weight_bins = weight_bins_dict;

    // Convert dictionary to a list of lists
    let edge_size_map;
    let edge_data_diff_list = [];
    if (edge_type === 'Frequency') {
        for (let [key, value] of Object.entries(edge_data_diff)) {
            key = key.split(',');
            edge_data_diff_list.push([key[0], key[1], key[2], value, value]);
        }
        edge_size_map = "mapData(weight," + Math.log2(Math.min(...weights)) + "," + Math.log2(Math.max(...weights)) + "," + EDGE_MAP_MIN_SIZE + "," + EDGE_MAP_MAX_SIZE + ")";
    }
    else {
        for (let [key, value] of Object.entries(edge_data_diff)) {
            key = key.split(',');
            edge_data_diff_list.push([key[0], key[1], key[2], value, Math.round((value / 100) * source_sum[key[0]])]);
        }
        edge_size_map = "mapData(weight," + Math.min(...weights) + "," + Math.max(...weights) + "," + EDGE_MAP_MIN_SIZE + "," + EDGE_MAP_MAX_SIZE + ")";
    }
    return [edge_data_diff_list, min_weight, max_weight, weight_bins, edge_size_map, signs];
}

function get_colors(keys, behaviours, colour_type) {
    // List of colors in rgb format
    let colors = [[0.0, 1.0, 0.0], [0.9943259034408901, 0.0012842177138555622, 0.9174329074599924],
                    [0.0, 0.5, 1.0], [1.0, 0.5, 0.0], [0.5, 0.75, 0.5],
                    [0.38539888501730646, 0.13504094033721226, 0.6030566783362241],
                    [0.2274309309202145, 0.9916143649051387, 0.9940075760357668], [1.0, 0.0, 0.0],
                    [0.19635097896407006, 0.5009447066269282, 0.02520413500628782], [1.0, 1.0, 0.0], [1.0, 0.5, 1.0],
                    [0.0, 0.0, 1.0], [0.0, 0.5, 0.5],
                    [0.9080663741715954, 0.24507985021755374, 0.45946418737627126],
                    [0.5419953696803366, 0.17214943372398184, 0.041558678566627205],
                    [0.9851725449490569, 0.7473699550058078, 0.4530441265365358],
                    [0.5307859786313746, 0.9399885275455782, 0.05504161834032317]];

    // Change color array to format accepted by pyvis
    colors = colors.map(color => "rgb(" + color[0] * 255 + "," + color[1] * 255 + "," + color[2] * 255 + ")");

    // Create a dictionary of colors for each node name
    let node_colors = {};
    if (colour_type === 'Behaviours') {
        for (let i = 0; i < behaviours.length; i++) {
            node_colors[behaviours[i]] = colors[i];
        }
    }
    else {
        for (let i = 0; i < keys.length; i++) {
            node_colors[keys[i]] = colors[i];
        }
    }
    return node_colors;
}

function get_selector_classes_comparison(node_names, behaviours, colors, node_size_map, edge_size_map, colour_type) {
    // Create a list of dictionaries with 'selector' and 'style' keys. 'selector' has a value of 'node' and 'style' has a dictionary
    let selector_node_classes = [];
    let selector_edge_classes = [];
    let names = node_names

    if (colour_type === 'Behaviours') {
        names = behaviours;
    }

    selector_node_classes.push(
        {
            'selector': '.node',
            'style': {
                'background-color': "white",
                'line-color': "white",
                'width': node_size_map,
                'height': node_size_map
            }
        }
    )
    selector_node_classes.push(
        {
            'selector': '.nodeLeader',
            'style': {
                'background-color': "white",
                'line-color': "FFFFFF",
                'shape': "star",
                'width': 100,
                'height': 100
            }
        }
    )

    // Iterate over node names
    for (let name of names) {
        selector_node_classes.push(
            {
                'selector': '.node' + name,
                'style': {
                    'background-color': colors[name],
                    'line-color': colors[name],
                    'width': node_size_map,
                    'height': node_size_map
                }
            }
        )
        selector_node_classes.push(
            {
                'selector': '.node' + name + 'positive',
                'style': {
                    'background-color': colors[name],
                    'line-color': colors[name],
                    'width': node_size_map,
                    'height': node_size_map,
                    'shape': "triangle"
                }
            }
        )
        selector_node_classes.push(
            {
                'selector': '.node' + name + 'negative',
                'style': {
                    'background-color': colors[name],
                    'line-color': colors[name],
                    'width': node_size_map,
                    'height': node_size_map,
                    'shape': "vee"
                }
            }
        )
        selector_edge_classes.push(
            {
                'selector': '.edge' + name + 'positive',
                'style': {
                    'line-color': colors[name],
                    'target-arrow-color': colors[name],
                    'target-arrow-shape': 'vee',
                    'curve-style': 'bezier',
                    'control-point-step-size': 100,
                    'width': edge_size_map
                }
            }
        )
        selector_edge_classes.push(
            {
                'selector': '.edge' + name + 'negative',
                'style': {
                    'line-color': colors[name],
                    'target-arrow-color': colors[name],
                    'target-arrow-shape': 'vee',
                    'curve-style': 'bezier',
                    'control-point-step-size': 100,
                    'width': edge_size_map,
                    'line-style': 'dashed',
                    'line-dash-pattern': [6, 10]
                }
            }
        )
    }
    return [selector_node_classes, selector_edge_classes];
}

function get_nodes_comparison(node_names, acronyms, freq, sizes, node_type, node_signs, colour_type) {
    // Create a list of random longitudes and latitudes with the size of the number of acronyms
    let longitudes = [];
    let latitudes = [];
    for (let i = 0; i < acronyms.length; i++) {
        longitudes.push(Math.random() * 360 - 180);
        latitudes.push(Math.random() * 180 - 90);
    }
    // Create list of lists with short name, label, long and lat
    let freq_values = [];
    for (let [key, value] of Object.entries(freq)) {
        freq_values.push(value);
    }
    let node_data = [];
    for (let i = 0; i < acronyms.length; i++) {
        node_data.push([node_names[i], acronyms[i], freq_values[i], longitudes[i], latitudes[i], sizes[i]]);
    }

    if (node_type === 'Behaviours') {
        var nodes = [];
        for (let i = 0; i < node_data.length; i++) {
            nodes.push({
                'data': {'id': node_data[i][0], 'label': node_data[i][1], 'freq': node_data[i][2], 'size': node_data[i][5]},
                'position': {'x': 20 * node_data[i][3], 'y': -20 * node_data[i][4]},
                'classes': "node" + node_data[i][0] + node_signs[i]
            });
        }
    }
    else {
        if (colour_type === 'Behaviours') {
            var nodes = [];
            for (let i = 0; i < node_data.length; i++) {
                nodes.push({
                    'data': {
                        'id': node_data[i][0],
                        'label': node_data[i][1],
                        'freq': node_data[i][2],
                        'size': node_data[i][5]
                    },
                    'position': {'x': 20 * node_data[i][3], 'y': -20 * node_data[i][4]},
                    'classes': "nodeParticipant"
                });
            }
        }
        else {
            var nodes = [];
            for (let i = 0; i < node_data.length; i++) {
                nodes.push({
                    'data': {
                        'id': node_data[i][0],
                        'label': node_data[i][1],
                        'freq': node_data[i][2],
                        'size': node_data[i][5]
                    },
                    'position': {'x': 20 * node_data[i][3], 'y': -20 * node_data[i][4]},
                    'classes': "node" + node_data[i][0] + " " + node_signs[i]
                });
            }
        }
    }
    return [node_data, nodes];
}

function get_behaviour_edges_comparison(edge_data, colour_source, signs) {
    let edges = [];
    if (colour_source === "Source") {
        for (let i = 0; i < edge_data.length; i++) {
            edges.push({
                'data': {
                    'source': edge_data[i][0],
                    'target': edge_data[i][1],
                    'behaviour': edge_data[i][2],
                    'weight': edge_data[i][3],
                    'original_weight': edge_data[i][4]
                },
                'classes': "edge" + edge_data[i][0] + signs[i]
            });
        }
    }
    else {
        for (let i = 0; i < edge_data.length; i++) {
            edges.push({
                'data': {
                    'source': edge_data[i][0],
                    'target': edge_data[i][1],
                    'behaviour': edge_data[i][2],
                    'weight': edge_data[i][3],
                    'original_weight': edge_data[i][4]
                },
                'classes': "edge" + edge_data[i][1] + signs[i]
            });
        }
    }
    return edges;
}

function get_participant_edges_comparison(edge_data, colour_type, colour_source, signs) {
    if (colour_type === 'Behaviours') {
        var edges = [];
        for (let i = 0; i < edge_data.length; i++) {
            edges.push({
                'data': {
                    'source': edge_data[i][0],
                    'target': edge_data[i][1],
                    'behaviour': edge_data[i][2],
                    'weight': edge_data[i][3],
                    'original_weight': edge_data[i][4]
                },
                'classes': "edge" + edge_data[i][2] + signs[i]
            });

        }
    }
    else {
        var edges = [];
        if (colour_source === "Source") {
            for (let i = 0; i < edge_data.length; i++) {
                edges.push({
                    'data': {
                        'source': edge_data[i][0],
                        'target': edge_data[i][1],
                        'behaviour': edge_data[i][2],
                        'weight': edge_data[i][3],
                        'original_weight': edge_data[i][4]
                    },
                    'classes': "edge" + edge_data[i][0] + signs[i]
                });
            }
        }
        else {
            for (let i = 0; i < edge_data.length; i++) {
                edges.push({
                    'data': {
                        'source': edge_data[i][0],
                        'target': edge_data[i][1],
                        'behaviour': edge_data[i][2],
                        'weight': edge_data[i][3],
                        'original_weight': edge_data[i][4]
                    },
                    'classes': "edge" + edge_data[i][1] + signs[i]
                });
            }
        }
    }
    return edges;
}

class DataFrame {
    // Constructor
    constructor(rows) {
        this.columns = rows[0].split(',');
        this.data = rows.slice(1).map(row => {
            let obj = {};
            const values = row.split(','); // Split each row by commas to get values
            this.columns.forEach((col, index) => {
                obj[col] = values[index];
            });
            return obj;
        });
    }

    // Method to get number of rows
    getNumRows() {
        return this.data.length;
    }

    // Method to get column names
    getColumns() {
        return this.columns;
    }

    // Method to get a column
    getColumn(columnName) {
        return this.data.map(row => row[columnName]);
    }

    // Method to drop columns
    drop(columnsToDrop) {
        this.data = this.data.map(row => {
            let newRow = { ...row };
            columnsToDrop.forEach(col => delete newRow[col]);
            return newRow;
        });
        this.columns = this.columns.filter(col => !columnsToDrop.includes(col));
    }

    // Method to remove rows where a specific column has a specific value
    removeRows(columnName, value) {
        this.data = this.data.filter(row => row[columnName] !== value);
    }

    // Method to keep only rows where a specific column has a specific value
    keepOnlyRows(columnName, value) {
        this.data = this.data.filter(row => row[columnName] === value);
    }

    // Method to display the DataFrame
    display() {
        console.table(this.data);
    }

    // Method to get a row by index
    getRow(index) {
        return this.data[index];
    }

    // Method to remove duplicate rows
    removeDuplicates() {
        const uniqueData = [];
        const seen = new Set();

        this.data.forEach(row => {
            const rowString = JSON.stringify(row);
            if (!seen.has(rowString)) {
                seen.add(rowString);
                uniqueData.push(row);
            }
        });

        this.data = uniqueData;
    }
}