// UNIVERSAL (ON EVERY PAGE)
var setCurrPage = function(name, id) 
{ 
	Session.set('currPage', name); 
	Session.set('currPageId', id) 
}
var getUserId = function() // returns userId or anonUserId
{
	var userId = localStorage.getItem('userId')
	if (userId)
		return userId
	else
		userId = localStorage.getItem('anonUserId')
		if (userId)
			return userId
}
var getFolders = function(currParent) {return Folders.find({parent: currParent})}
var getLists = function(currParent) {return Lists.find({parent: currParent})}
var getTasks = function(currParent) {}

// SUBSCRIPTIONS
var userId = getUserId()
if (userId)
{
	Lists = Meteor.subscribe('lists', userId)
	Folders = Meteor.subscribe('folders', userId)
	Tasks = Meteor.subscribe('tasks', userId)
}

Template.userAccounts.helpers
({
	'importAnonData': function()
	{ // double check Meteor.userId() (other check is in userAccounts html)
		var anonUserId = localStorage.getItem('anonUserId')
		var userId = Meteor.userId()
		if (userId && anonUserId)
		{
			Meteor.call('importAnonData', anonUserId)			
			// make sure no lists are unimported before deleting anonUserId
			if (!Lists.findOne({createdBy: anonUserId}) && !Folders.findOne({createdBy: anonUserId}))
			{
				localStorage.removeItem('anonUserId')
				localStorage.setItem('userId', userId) // could set this in an onLogin callback
			}
		}
	}
})

Template.folder.helpers
({
	'folder': function()
	{
		return getFolders(this._id)
	},
	'list': function()
	{
		return getLists(this._id)
	},
	'setCurrPage': function(){setCurrPage(this.name, this._id)}
})

// FAB HELPERS -------------
Template.fabForFolder.helpers
({
	'getAction': function(action)
	{
		return Session.get(action)
	},
	'placeholder': function()
	{
		var primaryAction = Session.get('primaryAction') 
		if (primaryAction == 'ion-folder')
			return "New Category"
		else if (primaryAction == 'ion-document-text')
			return "New Lyst"
	}
})

// TO BE CHANGED TO LIST ACTIONS
Template.fabForList.helpers
({
	'addingTime': function() {return Session.get('addingTime')},
	'getAction': function(action)
	{
		return Session.get(action)
	},
	'placeholderInfo': function()
	{
		var primaryAction = Session.get('primaryActionL')
		if (primaryAction == 'ion-android-done')
			return "Swipe To Dismiss"
		else if (primaryAction == 'ion-arrow-move')
			return 'Reorder'
	},
	'placeholderForm': function()
	{
		var primaryAction = Session.get('primaryActionL') 
		if (primaryAction == 'ion-plus')
				return "Add Task"
		else if (primaryAction == 'ion-edit')
			return "Edit Task"
	}
})

Template.fabForCalendar.helpers
({
	'getAction': function(action)
	{
		return Session.get(action)
	},
	'placeholderForm': function()
	{
		var primaryAction = Session.get('primaryActionC')
		if (primaryAction == 'ion-plus')
			return 'Add Event'
	},
	'placeholderInfo': function()
	{
		var primaryAction = Session.get('primaryActionC')
		if (primaryAction == 'ion-clipboard')
			return 'View Schedule'
	}

})

Template.navbar.helpers
({
	'currPage':function(){return Session.get('currPage')},
	'parent': function()
	{ 
		var pageId = Session.get('currPageId')
		var currList = Lists.findOne({_id: pageId })
		var currFolder = Folders.findOne({_id: pageId })

		if (currList)
			var parent = Folders.findOne({_id: currList.parent})
		else if (currFolder)
			var parent = Folders.findOne({_id: currFolder.parent})
		else
			return false
		if (parent)
			return parent._id
	}
})

Template.home.helpers
({
	'rootFolder': function()
	{
		if(Session.get('setRootFolder'))
			Session.delete('setRootFolder')
		rootFolder = Folders.findOne({root: true})
		console.log(rootFolder)
		if (rootFolder)
			return rootFolder._id
		else
			return false
	}
})

Template.list.helpers
({
	'isPrimaryAction': function(action)
	{
		var primaryAction = Session.get('primaryActionL')
		if (primaryAction == action)
			return true
	},
	'setCurrPage': function(){setCurrPage(this.name, this._id)},
	'task': function()
	{
		var userId = getUserId()
		return Tasks.find({parent: this._id, createdBy: userId, status: {$exists: false} }
			, {sort: {order: 1} })
	}
})

Template.root.helpers
({
	'setDate': function()
	{
		Session.set('today', "bananas")
	}
})

// CALENDAR ------------------------------------------------------------

var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
var months = 	["January", "February", "March", "April", "May", "June", "July", "August", 
	"September", "October", "November", "December"]
var getCurrDate = function() 
{
	var selectedDate = Session.get('selectedDate')
	if (!selectedDate)
		selectedDate = Session.get('today')
	return selectedDate
}
Template.calendar.helpers
({
	'calDay': function() // should rerun on month change
	{
		var today = Session.get('today'); 
		if (today)
		{
			var month = today.getMonth()
			var reverseDays = []; var days = []

			while (today.getMonth() == month && today.getDate() > 1)
			{
				reverseDays.push(today.getDate())
				today.setDate(today.getDate() - 1)
			}

			for (var i = 0; i < reverseDays.length; i++)
				days.push(i + 1)

			today = Session.get('today')

			 while (today.getMonth() == month)
			 {
			 	days.push(today.getDate())
				today.setDate(today.getDate() + 1)
			 }
			return days
		}
	},
	'setEvents': function()
	{
		var currDate = getCurrDate(); var currMonth = currDate.getMonth()
		var tasks = Tasks.find({month: currDate.getMonth()}).fetch()
		var numTasks = {}

		for (var i = 0; i < tasks.length; i++)
		{
			var day = tasks[i].day
			if (numTasks[day])
				numTasks[day]++
			else
				numTasks[day] = 1 
		}

		for (var theDay in numTasks)
			Session.set(theDay, numTasks[theDay])
	},
	'numEvents': function(day)
	{
		return Session.get(day)
	},
	'setDate': function()
	{
		Session.set('today', new Date())
	},
	'showDate': function(property)
	{

		var currDate = getCurrDate()

		if (property == 'weekday')
		 	return weekdays[currDate.getDay()]
		else if (property == 'month')
			return months[currDate.getMonth()]
		else if (property == 'date')
			return currDate.getDate()
		else if (property == 'year')
			return currDate.getFullYear()
	},
	'setCurrPage': function() // sets currPage to day of week
	{	
		var currDate = getCurrDate();
		if (currDate) 
			Session.set('currPage', weekdays[currDate.getDay()] ) 
	}	
})






