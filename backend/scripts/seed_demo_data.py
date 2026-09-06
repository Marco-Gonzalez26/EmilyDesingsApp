"""Seed demo data: marcas, categorias, productos, inventario e imagenes.

Idempotent: if there are already products in the DB, it does nothing.

Run from the backend directory:
    python -m scripts.seed_demo_data
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.config import SessionLocal
from app.models.models import (
    Marca,
    Categoria,
    Color,
    Talla,
    Producto,
    ImagenProducto,
    Inventario,
    Usuario,
)

MARCAS = [
    {"nombre": "Emily Designs", "descripcion": "Marca principal de la boutique"},
    {"nombre": "Elegance Studio", "descripcion": "Prendas elegantes y atemporales"},
    {"nombre": "Naturaleza Viva", "descripcion": "Moda sostenible y artesanal"},
    {"nombre": "Quevedo Chic", "descripcion": "Estilo urbano con raices locales"},
]

CATEGORIAS = [
    {"nombre": "Vestidos", "descripcion": "Vestidos para toda ocasion"},
    {"nombre": "Blusas", "descripcion": "Blusas y tops"},
    {"nombre": "Faldas", "descripcion": "Faldas de diferentes cortes"},
    {"nombre": "Pantalones", "descripcion": "Pantalones y jeans"},
    {"nombre": "Accesorios", "descripcion": "Complementos y accesorios"},
    {"nombre": "Abrigos", "descripcion": "Abrigos y chaquetas"},
]

COLORES = [
    {"nombre": "Negro", "codigo_hexadecimal": "#1a1a1a"},
    {"nombre": "Blanco", "codigo_hexadecimal": "#ffffff"},
    {"nombre": "Crema", "codigo_hexadecimal": "#f5ede3"},
    {"nombre": "Rosa", "codigo_hexadecimal": "#d4a5a5"},
    {"nombre": "Oro", "codigo_hexadecimal": "#c9a961"},
    {"nombre": "Sage", "codigo_hexadecimal": "#a8b5a0"},
]

TALLAS = [
    {"nombre": "XS", "orden": 1},
    {"nombre": "S", "orden": 2},
    {"nombre": "M", "orden": 3},
    {"nombre": "L", "orden": 4},
    {"nombre": "XL", "orden": 5},
]

# (nombre, descripcion, precio_regular, precio_descuento, marca, categoria, es_nuevo, es_oferta, es_destacado)
PRODUCTOS = [
    ("Vestido Floral Primavera", "Vestido midi con estampado floral, fresco y ligero.", 49.99, 39.99, "Emily Designs", "Vestidos", True, True, True),
    ("Vestido Negro Clasico", "Vestido de corte recto, ideal para eventos formales.", 59.99, None, "Elegance Studio", "Vestidos", False, False, True),
    ("Vestido Largo Bohemio", "Vestido largo con detalles de encaje y tirantes ajustables.", 69.99, 54.99, "Naturaleza Viva", "Vestidos", True, False, False),
    ("Blusa Seda Blanca", "Blusa de seda con cuello redondo y caida fluida.", 39.99, 29.99, "Emily Designs", "Blusas", True, True, True),
    ("Blusa Campesina", "Blusa con bordados artesanales de Quevedo.", 32.99, None, "Quevedo Chic", "Blusas", False, False, False),
    ("Top Escote V", "Top elegante con escote en V, talla ajustada.", 24.99, None, "Elegance Studio", "Blusas", True, False, False),
    ("Falda Lápiz", "Falda lapiz hasta la rodilla, corte moderno.", 29.99, 24.99, "Emily Designs", "Faldas", False, True, False),
    ("Falda Plisada Midi", "Falda plisada midi con movimiento suave.", 34.99, None, "Naturaleza Viva", "Faldas", True, False, False),
    ("Falda Denim", "Falda de mezclilla con cierre frontal.", 27.99, None, "Quevedo Chic", "Faldas", False, False, False),
    ("Jeans Rectos", "Jeans de corte recto, tela elastizada.", 44.99, 34.99, "Quevedo Chic", "Pantalones", True, True, True),
    ("Pantalon Palazzo", "Pantalon palazzo fluido, comodo y elegante.", 49.99, None, "Elegance Studio", "Pantalones", False, False, False),
    ("Pantalon Negro Slim", "Pantalon slim negro para toda ocasion.", 39.99, None, "Emily Designs", "Pantalones", False, False, False),
    ("Collar Dorado", "Collar delicado con acabado dorado.", 19.99, 14.99, "Emily Designs", "Accesorios", True, True, False),
    ("Bufanda de Algodon", "Bufanda suave de algodon en tonos tierra.", 15.99, None, "Naturaleza Viva", "Accesorios", False, False, False),
    ("Abrigo Camel", "Abrigo largo color camel con solapas.", 89.99, 69.99, "Elegance Studio", "Abrigos", True, True, True),
    ("Chaqueta de Cuero", "Chaqueta de cuero sintetico estilo motoquero.", 79.99, None, "Quevedo Chic", "Abrigos", False, False, True),
]

IMG_SERVICE = "https://picsum.photos/seed/emily-{n}/600/800"


def get_or_create(db, model, defaults, key_field="nombre"):
    obj = db.query(model).filter(getattr(model, key_field) == defaults[key_field]).first()
    if obj:
        return obj
    obj = model(**defaults)
    db.add(obj)
    db.flush()
    return obj


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Producto).count()
        if existing > 0:
            print(f"Skip: {existing} productos ya existen en la base.")
            return

        admin = db.query(Usuario).filter(Usuario.rol == "administrador").first()
        if not admin:
            admin = db.query(Usuario).first()
        if not admin:
            print("ERROR: no existe ningun usuario administrador para asignar productos.")
            return

        for m in MARCAS:
            get_or_create(db, Marca, m)
        for c in CATEGORIAS:
            get_or_create(db, Categoria, c)
        for c in COLORES:
            get_or_create(db, Color, c)
        for t in TALLAS:
            get_or_create(db, Talla, t)
        db.commit()

        marcas = {m.nombre: m for m in db.query(Marca).all()}
        categorias = {c.nombre: c for c in db.query(Categoria).all()}
        colores = db.query(Color).all()
        tallas = db.query(Talla).all()

        for i, (nombre, desc, precio, precio_desc, marca_n, cat_n, es_nuevo, es_oferta, es_dest) in enumerate(PRODUCTOS):
            sku = f"EMILY-{i+1:04d}"
            producto = Producto(
                sku=sku,
                nombre=nombre,
                descripcion=desc,
                precio_regular=precio,
                precio_descuento=precio_desc,
                marca_id=marcas[marca_n].id,
                categoria_id=categorias[cat_n].id,
                es_nuevo=es_nuevo,
                es_oferta=es_oferta,
                es_destacado=es_dest,
                activo=True,
                administrador_id=admin.id,
            )
            db.add(producto)
            db.flush()

            db.add(
                ImagenProducto(
                    producto_id=producto.id,
                    url_imagen=IMG_SERVICE.format(n=i + 1),
                    es_principal=True,
                    orden=1,
                )
            )
            db.add(
                ImagenProducto(
                    producto_id=producto.id,
                    url_imagen=IMG_SERVICE.format(n=i + 1 + 100),
                    es_principal=False,
                    orden=2,
                )
            )

            for color in colores[:2]:
                for talla in tallas:
                    stock = 5 + (i % 8)
                    db.add(
                        Inventario(
                            producto_id=producto.id,
                            talla_id=talla.id,
                            color_id=color.id,
                            stock=stock,
                            stock_reservado=0,
                        )
                    )

        db.commit()
        print(f"Seed completo: {len(MARCAS)} marcas, {len(CATEGORIAS)} categorias, {len(PRODUCTOS)} productos.")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed()