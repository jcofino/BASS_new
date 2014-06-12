$(document).ready(function(){
	


	var TableModel = Backbone.Model.extend({
		url: './data.json',
		data: {
			name: 'Jon',
			age: 30,
			weight: 150
		},
		tables: {
			'A': {
				'Furniture':	['Chairs',	'Tables',	'Couches',	'Desks',	'Beds'],
				'Office Supplies':	['Scissors',	'Paper',	'Staples',	'Pencils',	'Pens'],
				}
		}
	});
	
	var tableModel = new TableModel();
	
	var TableView = Backbone.View.extend({
		el: '#view',
		initialize: function() {
			//this.render();
			$.getJSON(this.model.url, function(data) {
				console.log(data.A);
			})
		},
		template: //'Hello Jonathan',
		_.template(
			//"<table><thead><th>Name</th><th>Age</th></thead>" + 
			"<table class='table bordered'><thead><th>Item 1</th><th>Item 2</th><th>Item 3</th><th>Item 4</th><th>Item 5</th></thead><tbody><td><%= Furniture[0] %></td><td><%= Furniture[1] %></td><td><%= Furniture[2] %></td><td><%= Furniture[3] %></td><td><%= Furniture[4] %></td></tbody></table>"
			//this.model.data
		),
		render: function() {
			this.$el.html( this.template(this.model.tables.A));
		}
	});
	
	var tableView = new TableView({model: tableModel});
//	tableView.fetch({
//		success: function() {
//			tableView.render();
//		}
//	});
	tableView.render();
});