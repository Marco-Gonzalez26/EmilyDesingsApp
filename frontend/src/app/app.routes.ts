import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { AboutUsComponent } from './features/about-us/about-us';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ProductListComponent } from './features/catalog/product-list/product-list';
import { ProductDetailComponent } from './features/catalog/product-detail/product-detail';
import { CartComponent } from './features/cart/cart';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { adminGuard, authGuard } from './core/guards/auth-guard';
import { CheckoutCancelComponent } from './features/checkout-cancel/checkout-cancel.component';
import { CheckoutSuccessComponent } from './features/checkout-success/checkout-success.component';
import { OrdersComponent } from './features/orders/orders.component';
import { OrderDetailComponent } from './features/order-detail/order-detail.component';

import { AdminLayoutComponent } from './layout/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';
import { AdminCategoryFormComponent } from './features/admin/categories/admin-category-form/admin-category-form.component';
import { AdminBrandFormComponent } from './features/admin/brands/admin-brand-form/admin-brand-form.component';
import { AdminColorsListComponent } from './features/admin/colors/admin-colors-list/admin-colors-list.component';
import { AdminColorFormComponent } from './features/admin/colors/admin-color-form/admin-color-form.component';
import { AdminSizesListComponent } from './features/admin/sizes/admin-sizes-list/admin-sizes-list.component';
import { AdminSizeFormComponent } from './features/admin/sizes/admin-size-form/admin-size-form.component';
import { AdminProductsListComponent } from './features/admin/products/admin-products-list/admin-products-list.component';
import { AdminProductFormComponent } from './features/admin/products/admin-product-form/admin-product-form.component';
import { AdminInventoryListComponent } from './features/admin/inventories/admin-inventories-list/admin-inventories-list.component';
import { AdminProductInventoryComponent } from './features/admin/inventories/admin-product-inventory/admin-product-inventory.component';
import { AdminOrdersListComponent } from './features/admin/orders/admin-orders-list/admin-orders-list.component';
import { AdminOrderDetailComponent } from './features/admin/orders/admin-order-detail/admin-order-detail.component';
import { AdminUserFormComponent } from './features/admin/users/admin-user-form/admin-user-form.component';
import { ChangePasswordComponent } from './features/auth/change-password/change-password.component';
import { ProfileComponent } from './features/profile/profile.component';
import { AdminUsersListComponent } from './features/admin/users/admin-users-list/admin-users-list.component';
import { AdminUserDetailComponent } from './features/admin/users/admin-user-detail/admin-user-detail.component';
import { ReportsComponent } from './features/admin/reports/reports.component';
import { TabsPage } from './layout/tabs/tabs.page';
import { AccountPageComponent } from './features/account/account.page';
import { ParaTiPage } from './features/para-ti/para-ti.page';
import { FavoritesPage } from './features/favorites/favorites.page';
import { Verify2faComponent } from './features/auth/verify-2fa/verify-2fa.component';
import { admin2faCanDeactivateGuard } from './core/guards/admin-2fa.guard';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: HomeComponent },
      { path: 'para-ti', component: ParaTiPage },
      { path: 'catalogo', component: ProductListComponent },
      { path: 'carrito', component: CartComponent },
      { path: 'cuenta', component: AccountPageComponent },
      { path: 'favoritos', component: FavoritesPage },
    ],
  },
  { path: 'productos/:id', component: ProductDetailComponent },
  { path: 'sobre-nosotros', component: AboutUsComponent },
  { path: 'iniciar-sesion', component: LoginComponent },
  { path: 'crear-cuenta', component: RegisterComponent },
  { path: 'verificar-2fa', component: Verify2faComponent },
  { path: 'cambiar-contraseña', component: ChangePasswordComponent },
  { path: 'perfil', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'checkout/success', component: CheckoutSuccessComponent, canActivate: [authGuard] },
  { path: 'checkout/cancel', component: CheckoutCancelComponent, canActivate: [authGuard] },
  { path: 'ordenes', component: OrdersComponent, canActivate: [authGuard] },
  { path: 'ordenes/:id', component: OrderDetailComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/admin/categories/admin-categories-list/admin-categories-list.component').then(
            (m) => m.AdminCategoriesListComponent,
          ),
      },
      { path: 'categorias/nueva', component: AdminCategoryFormComponent },
      { path: 'categorias/editar/:id', component: AdminCategoryFormComponent },
      {
        path: 'marcas',
        loadComponent: () =>
          import('./features/admin/brands/admin-brands-list/admin-brands-list.component').then(
            (m) => m.AdminBrandsListComponent,
          ),
      },
      { path: 'marcas/nueva', component: AdminBrandFormComponent },
      { path: 'marcas/editar/:id', component: AdminBrandFormComponent },
      {
        path: 'colores',
        children: [
          { path: '', component: AdminColorsListComponent },
          { path: 'nuevo', component: AdminColorFormComponent },
          { path: 'editar/:id', component: AdminColorFormComponent },
        ],
      },
      {
        path: 'tallas',
        children: [
          { path: '', component: AdminSizesListComponent },
          { path: 'nueva', component: AdminSizeFormComponent },
          { path: 'editar/:id', component: AdminSizeFormComponent },
        ],
      },
      {
        path: 'productos',
        children: [
          { path: '', component: AdminProductsListComponent },
          { path: 'nuevo', component: AdminProductFormComponent },
          { path: 'editar/:id', component: AdminProductFormComponent },
        ],
      },
      {
        path: 'inventario',
        children: [
          { path: '', component: AdminInventoryListComponent },
          { path: 'producto/:id', component: AdminProductInventoryComponent },
        ],
      },
      {
        path: 'ordenes',
        children: [
          { path: '', component: AdminOrdersListComponent },
          { path: ':id', component: AdminOrderDetailComponent },
        ],
      },
      {
        path: 'usuarios',
        children: [
          { path: '', component: AdminUsersListComponent },
          { path: 'crear', component: AdminUserFormComponent },
          { path: 'editar/:id', component: AdminUserFormComponent },
          { path: ':id', component: AdminUserDetailComponent },
        ],
      },
      { path: 'reportes', component: ReportsComponent },
      {
        path: 'configuracion',
        loadComponent: () => import('./features/admin/configuracion/configuracion.component').then((m) => m.ConfiguracionComponent),
        canDeactivate: [admin2faCanDeactivateGuard],
      },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
