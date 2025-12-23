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

void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) msg += (char)payload[i];

  int pin = String(topic).substring(String(topic).lastIndexOf("/") + 1).toInt();

  if (msg == "active") {
    digitalWrite(pin, HIGH);
  } else {
    digitalWrite(pin, LOW);
  }

  Serial.println("Relay PIN " + String(pin) + " -> " + msg);
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting MQTT...");
    if (client.connect(ESP_ID)) {
      Serial.println("connected");
      client.subscribe("powernest/ESP_RELAY_ROOM_101/relay/+");
    } else {
      Serial.println("failed, retrying...");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < pinCount; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], LOW);
  }

  connectWiFi();
  client.setServer(mqtt_server, 1883);
  client.setBufferSize(512);   
  client.setCallback(callback);
  connectMQTT();

  Serial.println("RELAY ESP READY");
}

void loop() {
  if (!client.connected()) connectMQTT();
  client.loop();
  delay(10);   
}
