'user strict';

const Notifications = require('../models/notificationModel');

class Notification {

    /**
     * Constructor
     */
    // constructor() {      
        
    // }

    /**
     * Add notification
     * 
     * @param {Object} notificationDetails 
     */
    async addNotification(notificationDetails) {
        try {
           const notification = await Notifications.create(notificationDetails);
           //console.log(notification);
        } catch (error) {
            console.log("ERROR while creating notification ==> ",error)
        }
    };

    /**
     * Remove notification
     * 
     * @param {Object} notificationDetails 
     */

    async removeNotification(notificationDetails) {
        try {
            
         } catch (error) {
             console.log("ERROR while removing notification ==> ",error)
         }
    }

}

module.exports = Notification;