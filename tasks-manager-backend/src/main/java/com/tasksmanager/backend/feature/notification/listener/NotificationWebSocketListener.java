package com.tasksmanager.backend.feature.notification.listener;
import com.tasksmanager.backend.feature.notification.event.NotificationCreatedEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/*
 * Sends a new notification to the correct connected user
 * after the database transaction commits successfully.
 */
@Component
public class NotificationWebSocketListener {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public NotificationWebSocketListener(
            SimpMessagingTemplate messagingTemplate
    ) {
        this.messagingTemplate = messagingTemplate;
    }

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void handleNotificationCreated(
            NotificationCreatedEvent event
    ) {
        messagingTemplate.convertAndSendToUser(
                event.getRecipientUsername(),
                "/queue/notifications",
                event.getNotification()
        );
    }
}
