def validar_cedula_ruc(cedula_ruc: str) -> bool:
    """
    Validar cédula (10 dígitos) o RUC (13 dígitos) ecuatoriano
    """
    if not cedula_ruc or not cedula_ruc.isdigit():
        return False

    length = len(cedula_ruc)

    # Validar cédula (10 dígitos)
    if length == 10:
        return validar_cedula(cedula_ruc)

    # Validar RUC (13 dígitos)
    elif length == 13:
        # RUC termina en 001
        if not cedula_ruc.endswith("001"):
            return False
        # Los primeros 10 dígitos deben ser una cédula válida
        return validar_cedula(cedula_ruc[:10])

    return False


def validar_cedula(cedula: str) -> bool:
    """
    Validar cédula ecuatoriana de 10 dígitos usando algoritmo módulo 10
    """
    if len(cedula) != 10:
        return False

    # Los dos primeros dígitos deben estar entre 01 y 24 
    provincia = int(cedula[:2])
    if provincia < 1 or provincia > 24:
        return False

    # Algoritmo de validación
    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    suma = 0

    for i in range(9):
        valor = int(cedula[i]) * coeficientes[i]
        if valor > 9:
            valor -= 9
        suma += valor

    resultado = suma % 10
    verificador = 0 if resultado == 0 else 10 - resultado

    return verificador == int(cedula[9])
