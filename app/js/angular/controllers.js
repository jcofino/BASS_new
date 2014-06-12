var tableApp = angular.module('ngTableApp', []).controller('ngTableAppController', function ($scope) {
	  $scope.rows = [
	    {
	    	'category': 'Furniture',
	     	'cells': ['Chairs',	'Tables',	'Couches',	'Desks',	'Beds']
	     },
	    {
	    'category': 'Office Supplies',
	     'cells': ['Scissors',	'Paper',	'Staples',	'Pencils',	'Pens']
	     },
	    
	  ];
});


/*
{
	'A': {
		'Furniture':	{'Chairs',	'Tables',	'Couches',	'Desks',	'Beds'},
		'Office Supplies':	{'Scissors',	'Paper',	'Staples',	'Pencils',	'Pens'},
		}
};*/