from dash import Dash, html, Input, Output, callback, dcc, ctx, State, ClientsideFunction
import dash_cytoscape as cyto
import dash_bootstrap_components as dbc

from functions import *

group_by = 'Teams'
database_1 = 'GEC2017'
database_2 = 'GEC2017'
team_1 = 'All'
meeting_1 = '1'
team_2 = 'All'
meeting_2 = '2'

node_type = 'Behaviours'
edge_type = 'Frequency'
colour_type = 'Behaviours'
colour_source = 'Source'
show_edges = 'All'
normalise = True

teams_1, meetings_1, teams_2, meetings_2, node_data, edge_data, nodes, edges, selector_node_classes, selector_edge_classes, min_weight, max_weight, weight_bins, node_signs, edge_signs, node_names, behaviours, node_size_map = load_dataset_comparison(group_by, database_1, team_1, meeting_1, database_2, team_2, meeting_2, node_type, edge_type, colour_type, colour_source, normalise)
legend_nodes = get_legend_nodes(node_names, selector_node_classes, colour_type, behaviours, node_size_map)

app = Dash(__name__, external_stylesheets=[dbc.themes.DARKLY])

default_stylesheet = [
    # Group selectors for nodes
    {
        'selector': 'node',
        'style': {
            #'background-color': '#00000',
            'label': 'data(label)',
            'font-size': '20px',
            'text-halign':'center',
            'text-valign':'center'
        },
    },
        {
            'selector': 'label',
            'style': {
                'content': 'data(label)',
                'color': 'white',
            }
        }
]

legend_stylesheet = [
    # Group selectors for nodes
    {
        'selector': 'node',
        'style': {
            'label': 'data(label)',
            'font-size': '20px',
            'text-halign': 'right',
            'text-valign': 'center'
        }
    },
    {
        'selector': 'label',
        'style': {
            'content': 'data(label)',
            'color': 'white',
            'text-margin-x': '10px',
        }
    },

]

layout_dropdown = html.Div([
    html.P("Layout:"),
    dcc.Dropdown(
        id='dropdown-update-layout',
        value='grid',
        clearable=False,
        options=[
            {'label': name.capitalize(), 'value': name}
            for name in ['grid', 'random', 'circle', 'cose', 'concentric']
        ],
        style={'width': '150px'},
        className='dash-bootstrap'
    )
], style = {'display': 'inline-block', 'margin-left': '20px'})

group_dropdown = html.Div([
    html.P("Group by:"),
    dcc.Dropdown(
        id='dropdown-update-group',
        value='Teams',
        clearable=False,
        options=[
            {'label': name, 'value': name}
            for name in ['Teams', 'teammark', 'airtime_evenness', 'psy_safe', 'expgroup']
        ],
        style={'width': '150px'},
        className='dash-bootstrap'
    )
], style = {'display': 'inline-block', 'margin-left': '20px'})

database_1_dropdown = html.Div([
    html.P("Database 1: "),
    dcc.Dropdown(
        id='dropdown-update-database',
        value='GEC2017',
        clearable=False,
        options=[
        {'label': name, 'value': name}
        for name in ['GEC2017', 'GEC2018', 'EYH2017', 'EYH2018', 'IDP2019', 'IDP2020']
        ],
        className='dash-bootstrap',
        style={'width': '200px'},
    )],
    style = {'display': 'inline-block', 'margin-left': '20px'},
)

team_1_dropdown = html.Div([
    html.P("Team 1:"),
    dcc.Dropdown(
        id = 'dropdown-update-team',
        value='All',
        clearable=False,
        options=[
            {'label': name, 'value': name}
            for name in teams_1
        ],
        style={'width': '200px'},
        className='dash-bootstrap'
    )],
    style = {'display': 'inline-block', 'margin-left': '20px'}
)

meeting_1_dropdown = html.Div([
    html.P("Meeting 1:"),
    dcc.Dropdown(
        id = 'dropdown-update-meeting',
        value='1',
        clearable=False,
        options=[
            {'label': name, 'value': name}
            for name in meetings_1
        ],
        style={'width': '200px'},
        className='dash-bootstrap'
    )],
    style = {'display': 'inline-block', 'margin-left': '20px'}
)

database_2_dropdown = html.Div([
    html.P("Database 2: "),
    dcc.Dropdown(
        id='dropdown-update-database-compare',
        value='GEC2017',
        clearable=False,
        options=[
        {'label': name, 'value': name}
        for name in ['GEC2017', 'GEC2018', 'EYH2017', 'EYH2018', 'IDP2019', 'IDP2020']
        ],
        className='dash-bootstrap',
        style={'width': '200px'},
    )],
    style = {'display': 'inline-block', 'margin-left': '20px'},
)

team_2_dropdown = html.Div([
    html.P("Team 2:"),
    dcc.Dropdown(
        id = 'dropdown-update-team-compare',
        value='All',
        clearable=False,
        options=[
            {'label': name, 'value': name}
            for name in teams_2
        ],
        style={'width': '200px'},
        className='dash-bootstrap'
    )],
    style = {'display': 'inline-block', 'margin-left': '20px'}
)

meeting_2_dropdown = html.Div([
    html.P("Meeting 2:"),
    dcc.Dropdown(
        id = 'dropdown-update-meeting-compare',
        value='2',
        clearable=False,
        options=[
            {'label': name, 'value': name}
            for name in meetings_2
        ],
        style={'width': '200px'},
        className='dash-bootstrap'
    )],
    style = {'display': 'inline-block', 'margin-left': '20px'}
)

node_type_radio = html.Div([html.P("Node:", style = {'display': 'inline-block'}),
    html.Div(dcc.RadioItems(['Behaviours', 'Participants'], id='radio-update-nodes', value='Behaviours', inline=True, inputStyle={'margin-right': '10px', 'margin-left': '10px'}), style={'display': 'inline-block'})
], style={'margin-left': '20px', 'margin-top': '20px', 'display': 'inline-block'})

edge_type_radio = html.Div([html.P("Edge:", style = {'display': 'inline-block'}),
    html.Div(dcc.RadioItems(['Frequency', 'Probability'], id='radio-update-edges', value='Frequency', inline=True, inputStyle={'margin-right': '10px', 'margin-left': '10px'}), style={'display': 'inline-block'})
], style={'margin-left': '20px', 'margin-top': '20px', 'display': 'inline-block'})

colour_type_radio = html.Div([html.P("Colour by:", style = {'display': 'inline-block'}),
    html.Div(dcc.RadioItems(['Behaviours', 'Participants'], id='radio-update-colour_type', value='Behaviours', inline=True, inputStyle={'margin-right': '10px', 'margin-left': '10px'}), style={'display': 'inline-block'})
], style={'margin-left': '20px', 'margin-top': '20px', 'display': 'inline-block'})

colour_source_radio = html.Div([html.P("Colour by:", style = {'display': 'inline-block'}),
    html.Div(dcc.RadioItems(['Source', 'Target'], id='radio-update-colour-source', value='Source', inline=True, inputStyle={'margin-right': '10px', 'margin-left': '10px'}), style={'display': 'inline-block'})
], style={'margin-left': '20px', 'margin-top': '20px', 'display': 'inline-block'})

show_edge_options_radio = html.Div([html.P("Show edges:", style = {'display': 'inline-block'}),
    html.Div(dcc.RadioItems(['All', 'Positive', 'Negative'], id='radio-update-edge-options', value='All', inline=True, inputStyle={'margin-right': '10px', 'margin-left': '10px'}), style={'display': 'inline-block'})
], style={'margin-left': '20px', 'margin-top': '20px', 'display': 'inline-block'})

normalise_checkbox = html.Div([dcc.Checklist(['Normalise'], id='checkbox-update-normalise', value=['Normalise'], inline=True, inputStyle={'margin-right': '10px', 'margin-left': '10px'})],
                              style={'margin-left': '20px', 'margin-top': '20px', 'display': 'inline-block'})

update_button = html.Div([
    dbc.Button("Update", id='update-button', color="primary", className="mr-1", style = {'margin-left': '20px'})
], style = {'display': 'inline-block'})

options_div = html.Div([node_type_radio, edge_type_radio, colour_type_radio, colour_source_radio, show_edge_options_radio, normalise_checkbox, update_button])

graph = html.Div([cyto.Cytoscape(
        id='BiT',
        layout={'name': 'grid',
                'radius': 200},
        elements = edges+nodes,
        stylesheet = selector_node_classes + selector_edge_classes + default_stylesheet,
        style={'width': '80%', 'height': '780px', 'display': 'inline-block'},
    ),cyto.Cytoscape(id='BiT2',
        layout={'name': 'grid', 'columns': 1},
        elements = legend_nodes,
        stylesheet = selector_node_classes + legend_stylesheet,
        style={'width': '20%', 'height': '780px', 'display': 'inline-block'},
                     userPanningEnabled=False,
                     userZoomingEnabled=False,)
])

weight_slider = html.Div([
    html.P("Weight threshold", id='weight-slider-output', style={'margin-left': '20px'}),
    dcc.RangeSlider(
        min = min_weight,
        max = max_weight + 1,
        step = 1,
        value = [min_weight, max_weight],
        marks = weight_bins,
        allowCross = False,
        id = 'weight-slider'
    )
])

tooltip = html.Div([
    html.P(id='tooltip')
], style={'margin-left': '10px'})

node_type_dcc = dcc.Store(id='node_type', data='Behaviours')
edge_type_dcc = dcc.Store(id='edge_type', data='Frequency')
colour_type_dcc = dcc.Store(id='colour_type', data='Behaviours')
colour_source_dcc = dcc.Store(id='colour_source', data='Source')
show_edges_dcc = dcc.Store(id='show_edges', data='All')
normalise_dcc = dcc.Store(id='normalise', data=True)

min_weight_dcc = dcc.Store(id='min_weight', data=min_weight)
max_weight_dcc = dcc.Store(id='max_weight', data=max_weight)

group_by_dcc = dcc.Store(id='group_by', data='Teams')
database_1_dcc = dcc.Store(id='database_1', data='GEC2017')
database_2_dcc = dcc.Store(id='database_2', data='GEC2017')
team_1_dcc = dcc.Store(id='team_1', data='All')
team_2_dcc = dcc.Store(id='team_2', data='All')
meeting_1_dcc = dcc.Store(id='meeting_1', data='1')
meeting_2_dcc = dcc.Store(id='meeting_2', data='2')

legend_stylesheet_dcc = dcc.Store(id='legend_stylesheet', data=legend_stylesheet)
default_stylesheet_dcc = dcc.Store(id='default_stylesheet', data=default_stylesheet)

node_data_dcc = dcc.Store(id='node_data', data=node_data)
node_signs_dcc = dcc.Store(id='node_signs', data=node_signs)
edge_data_dcc = dcc.Store(id='edge_data', data=edge_data)
# Convert edge_signs (dict with keys as tuples) to something equivalent in JS
edge_signs_list = [[list(k), v] for k, v in edge_signs.items()]
edge_signs_dcc = dcc.Store(id='edge_signs', data=edge_signs_list)

graph_tab = html.Div([layout_dropdown, group_dropdown, database_1_dropdown, team_1_dropdown, meeting_1_dropdown, database_2_dropdown, team_2_dropdown, meeting_2_dropdown, options_div, graph, weight_slider, tooltip,
                        node_type_dcc, edge_type_dcc, colour_type_dcc, colour_source_dcc, show_edges_dcc, normalise_dcc,
                        min_weight_dcc, max_weight_dcc, legend_stylesheet_dcc, default_stylesheet_dcc,
                        group_by_dcc, database_1_dcc, database_2_dcc, team_1_dcc, team_2_dcc, meeting_1_dcc, meeting_2_dcc,
                        node_data_dcc, node_signs_dcc, edge_data_dcc, edge_signs_dcc])

app.layout = graph_tab

# Hover callbacks

# Nodes
app.clientside_callback(
    """
    function(hover_node_data) {
        return hover_node_data['id'] + " with frequency: " + parseFloat(hover_node_data['freq']).toFixed(3);
    }
    """,
    Output('tooltip', 'children', allow_duplicate=True),
    [Input('BiT', 'mouseoverNodeData')],
    prevent_initial_call=True
)

# Edges
app.clientside_callback(
    """
    function(hover_edge_data, node_type, edge_type) {
        if (node_type == 'Behaviours') {
            if (edge_type == 'Frequency') {
                return hover_edge_data['source'] + " -> " + hover_edge_data['target'] + ": " + parseFloat(hover_edge_data['original_weight']).toFixed(4);
            }
            else {
                return hover_edge_data['source'] + " -> " + hover_edge_data['target'] + ": " + parseFloat(hover_edge_data['weight']).toFixed(3) + " (" + parseFloat(hover_edge_data['weight']).toFixed(2) + "%)";
            }
        }
        else {
            if (edge_type == 'Frequency') {
                return hover_edge_data['source'] + " -> " + hover_edge_data['target'] + ", " + hover_edge_data['behaviour'] + ": " + parseFloat(hover_edge_data['original_weight']).toFixed(4);
            }
            else {
                return hover_edge_data['source'] + " -> " + hover_edge_data['target'] + ", " + hover_edge_data['behaviour'] + ": " + parseFloat(hover_edge_data['original_weight']).toFixed(3) + " (" + parseFloat(hover_edge_data['weight']).toFixed(3) + "%)";
            }
        }
    }
    """,
    Output('tooltip', 'children', allow_duplicate=True),
    [Input('BiT', 'mouseoverEdgeData')],
     State('node_type', 'data'),
     State('edge_type', 'data'),
    prevent_initial_call=True
)

# Select node callback
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='select_nodes'
    ),
    Output('BiT', 'elements', allow_duplicate=True),
    [Input('BiT', 'selectedNodeData')],
    State('node_data', 'data'),
    State('node_type', 'data'),
    State('node_signs', 'data'),
    State('colour_type', 'data'),
    State('colour_source', 'data'),
    State('edge_data', 'data'),
    State('edge_signs', 'data'),
    prevent_initial_call=True
)

# Dropdown callbacks

# Layout
app.clientside_callback(
    """
    function(value) {
        return {
            'name': value
        }
    }
    """,
    Output('BiT', 'layout'),
    [Input('dropdown-update-layout', 'value')],
    prevent_initial_call=True
)

# Group by
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='get_teams_for_group_both_databases'
    ),
    Output('dropdown-update-team', 'options'),
    Output('dropdown-update-team-compare', 'options'),
    Output('group_by', 'data'),
    [Input('dropdown-update-group', 'value')],
    State('database_1', 'data'),
    State('database_2', 'data'),
    prevent_initial_call=True
)

# Database 1
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='get_teams_for_group'
    ),
    Output('dropdown-update-team', 'options', allow_duplicate=True),
    Output('database_1', 'data'),
    [Input('dropdown-update-database', 'value')],
    State('group_by', 'data'),
    prevent_initial_call=True
)

# Database 2
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='get_teams_for_group'
    ),
    Output('dropdown-update-team-compare', 'options', allow_duplicate=True),
    Output('database_2', 'data'),
    [Input('dropdown-update-database-compare', 'value')],
    State('group_by', 'data'),
    prevent_initial_call=True
)

# Team 1
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='get_meetings_for_team'
    ),
    Output('dropdown-update-meeting', 'options'),
    Output('team_1', 'data'),
    [Input('dropdown-update-team', 'value')],
    State('database_1', 'data'),
    State('group_by', 'data'),
    prevent_initial_call=True
)

# Team 2
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='get_meetings_for_team'
    ),
    Output('dropdown-update-meeting-compare', 'options'),
    Output('team_2', 'data'),
    [Input('dropdown-update-team-compare', 'value')],
    State('database_2', 'data'),
    State('group_by', 'data'),
    prevent_initial_call=True
)

# Meeting 1
app.clientside_callback(
    """
    function(value) {
        return value;
    }
    """,
    Output('meeting_1', 'data'),
    [Input('dropdown-update-meeting', 'value')],
    prevent_initial_call=True
)

# Meeting 2
app.clientside_callback(
    """
    function(value) {
        return value;
    }
    """,
    Output('meeting_2', 'data'),
    [Input('dropdown-update-meeting-compare', 'value')],
    prevent_initial_call=True
)

# Radio button callbacks

# Node type
app.clientside_callback(
    """
    function(node_type) {
        return node_type;
    }
    """,
    Output('node_type', 'data'),
    [Input('radio-update-nodes', 'value')],
    prevent_initial_call=True
)

# Edge type
app.clientside_callback(
    """
    function(edge_type) {
        return edge_type;
    }
    """,
    Output('edge_type', 'data'),
    [Input('radio-update-edges', 'value')],
    prevent_initial_call=True
)

# Colour type
app.clientside_callback(
    """
    function(colour_type) {
        return colour_type;
    }
    """,
    Output('colour_type', 'data'),
    [Input('radio-update-colour_type', 'value')],
    prevent_initial_call=True
)

# Colour source
app.clientside_callback(
    """
    function(colour_source) {
        return colour_source;
    }
    """,
    Output('colour_source', 'data'),
    [Input('radio-update-colour-source', 'value')],
    prevent_initial_call=True
)

# Show edges
app.clientside_callback(
    """
    function(show_edges) {
        return show_edges;
    }
    """,
    Output('show_edges', 'data'),
    [Input('radio-update-edge-options', 'value')],
    prevent_initial_call=True
)

app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='show_hide_edges'
    ),
    Output('BiT', 'elements', allow_duplicate=True),
    Input('show_edges', 'data'),
    State('node_data', 'data'),
    State('node_type', 'data'),
    State('node_signs', 'data'),
    State('colour_type', 'data'),
    State('colour_source', 'data'),
    State('edge_data', 'data'),
    State('edge_signs', 'data'),
    prevent_initial_call=True
)

# Normalise checkbox
app.clientside_callback(
    """
    function(normalise) {
        if (normalise.includes('Normalise')) {
            return true;
        }
        else {
            return false;
        }
    }
    """,
    Output('normalise', 'data'),
    [Input('checkbox-update-normalise', 'value')],
    prevent_initial_call=True
)

# Weight slider
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='show_weight_edges'
    ),
    Output('BiT', 'elements'),
    Output('weight-slider-output', 'children'),
    Input('weight-slider', 'value'),
    State('node_data', 'data'),
    State('node_type', 'data'),
    State('edge_type', 'data'),
    State('node_signs', 'data'),
    State('colour_type', 'data'),
    State('colour_source', 'data'),
    State('edge_data', 'data'),
    State('edge_signs', 'data'),
    State('min_weight', 'data'),
    State('max_weight', 'data'),
    State('show_edges', 'data')
)

# Update button
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='update_graph'
    ),
    Output('BiT', 'elements', allow_duplicate=True),
    Output('BiT', 'stylesheet', allow_duplicate=True),
    Output('weight-slider', 'min'),
    Output('weight-slider', 'max'),
    Output('weight-slider', 'marks'),
    Output('weight-slider', 'value'),
    Output('BiT2', 'elements'),
    Output('BiT2', 'stylesheet'),
    Output('node_data', 'data'),
    Output('edge_data', 'data'),
    Output('node_signs', 'data'),
    Output('edge_signs', 'data'),
    Input('update-button', 'n_clicks'),
    State('group_by', 'data'),
    State('database_1', 'data'),
    State('team_1', 'data'),
    State('meeting_1', 'data'),
    State('database_2', 'data'),
    State('team_2', 'data'),
    State('meeting_2', 'data'),
    State('node_type', 'data'),
    State('edge_type', 'data'),
    State('colour_type', 'data'),
    State('colour_source', 'data'),
    State('normalise', 'data'),
    State('legend_stylesheet', 'data'),
    State('default_stylesheet', 'data'),
    prevent_initial_call=True
)

if __name__ == '__main__':
    app.run_server(debug=False)
