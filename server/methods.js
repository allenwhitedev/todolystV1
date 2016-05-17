Meteor.publish('lists', function(userId)
{
	return Lists.find({createdBy: userId})
})

Meteor.publish('folders', function(userId)
{
	return Folders.find({createdBy: userId})
})
Meteor.publish('tasks', function(userId)
{
	return Tasks.find({createdBy: userId})
})

Meteor.methods
({
	'importAnonData': function(anonUserId)
	{
		var userId = Meteor.userId()
		if (userId)
		{
			Lists.update({createdBy: anonUserId}, {$set: {createdBy: userId}}, {multi: true}),
			Folders.update({createdBy: anonUserId}, {$set: {createdBy: userId}}, {multi: true})			
		}

	}
})