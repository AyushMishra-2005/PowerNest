#include <WiFi.h>
#include <PubSubClient.h>

#define ESP_ID "ESP_PIR_ROOM_101"

const char* ssid = "Wokwi-GUEST";
const char* password = "";

const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

// ALL PIR PINS
int pirPins[] = {
  4, 5, 12, 13, 14,
  18, 19, 21, 22, 23,
  25, 26, 27,
  32, 33
};

int pirCount = sizeof(pirPins) / sizeof(pirPins[0]);
int lastState[20];

void connectWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void connectMQTT() {
  while (!client.connected()) {
    client.connect(ESP_ID);
  }
}

void setup() {
  Serial.begin(115200);

  connectWiFi();
  client.setServer(mqtt_server, mqtt_port);
  connectMQTT();

  for (int i = 0; i < pirCount; i++) {
    pinMode(pirPins[i], INPUT_PULLDOWN);
    lastState[i] = LOW;
  }

  Serial.println("PIR ESP READY: " ESP_ID);
}

void loop() {
  if (!client.connected()) connectMQTT();
  client.loop();

  for (int i = 0; i < pirCount; i++) {
    int currentState = digitalRead(pirPins[i]);

    if (currentState != lastState[i]) {
      String topic = "powernest/" + String(ESP_ID) +
                     "/pir/" + String(pirPins[i]);

      client.publish(
        topic.c_str(),
        currentState == HIGH ? "active" : "stopped"
      );

      Serial.println(topic + " -> " +
        (currentState == HIGH ? "active" : "stopped"));

      lastState[i] = currentState;
    }
  }
}
