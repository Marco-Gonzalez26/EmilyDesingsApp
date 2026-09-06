from enum import Enum

class OrdenEstado(str, Enum):
    PENDIENTE = "Pendiente"
    CONFIRMADO = "Confirmado"
    EN_PROCESO = "En Proceso"
    ENVIADO = "Enviado"
    ENTREGADO = "Entregado"
    CANCELADO = "Cancelado"
