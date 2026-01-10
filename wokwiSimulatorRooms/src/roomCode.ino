#include <WiFi.h>
#include <PubSubClient.h>

#define ESP_ID "ESP_RELAY_ROOM_101"

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.hivemq.com";

WiFiClient espClient;
PubSubClient client(espClient);


int relayPins[] = {
  4, 5, 12, 13, 14,
  18, 19, 21, 22, 23,
  25, 26, 27,
  32, 33
};

int pinCount = sizeof(relayPins) / sizeof(relayPins[0]);

unsigned long lastActiveTime[40];
const unsigned long RELAY_TIMEOUT = 4000; 

void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  int pin = String(topic)
              .substring(String(topic).lastIndexOf("/") + 1)
              .toInt();

  if (msg == "active") {
    digitalWrite(pin, HIGH);
    lastActiveTime[pin] = millis(); 
    Serial.println("Relay PIN " + String(pin) + " -> ON");
  }
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void connectMQTT() {
  while (!client.connected()) {
    if (client.connect(ESP_ID)) {
      client.subscribe("powernest/ESP_RELAY_ROOM_101/relay/+");
    } else {
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < pinCount; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], LOW);
    lastActiveTime[relayPins[i]] = 0;
  }

  connectWiFi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  connectMQTT();

  Serial.println("RELAY ESP READY: " ESP_ID);
}

void loop() {
  if (!client.connected()) connectMQTT();
  client.loop();

  unsigned long now = millis();

  for (int i = 0; i < pinCount; i++) {
    int pin = relayPins[i];

    if (digitalRead(pin) == HIGH &&
        now - lastActiveTime[pin] > RELAY_TIMEOUT) {

      digitalWrite(pin, LOW);
      Serial.println("Relay PIN " + String(pin) + "auto OFF");
    }
  }

  delay(10);
}
